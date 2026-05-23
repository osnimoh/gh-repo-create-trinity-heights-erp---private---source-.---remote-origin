-- Workstream 6 — Academics: assessments, results, report cards, timetable.
--
-- Teachers may enter results ONLY for classes they teach (is_teacher_of_class).
-- `result` is a protected table — every write is audited. Report cards are
-- assembled by an RPC that mirrors the WASSCE bands in lib/academics/grading.ts.

-- ─────────────────────────────────────────────────────────────────────────
-- WASSCE grade from a 0–100 percentage. Mirrors grading.ts.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.wassce_grade(p_percent numeric)
returns text
language sql
immutable
as $$
  select case
    when p_percent >= 75 then 'A1'
    when p_percent >= 70 then 'B2'
    when p_percent >= 65 then 'B3'
    when p_percent >= 60 then 'C4'
    when p_percent >= 55 then 'C5'
    when p_percent >= 50 then 'C6'
    when p_percent >= 45 then 'D7'
    when p_percent >= 40 then 'E8'
    else 'F9'
  end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────
create table public.assessment (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null references public.class_subject (id) on delete cascade,
  term_id uuid not null references public.term (id) on delete cascade,
  name text not null,
  max_score numeric(6, 2) not null default 100 check (max_score > 0),
  weight numeric(6, 2) not null default 1 check (weight >= 0),
  assessment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (class_subject_id, term_id, name)
);

create table public.result (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessment (id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  score numeric(6, 2) not null check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (assessment_id, student_id)
);

create table public.report_card (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  term_id uuid not null references public.term (id) on delete cascade,
  class_id uuid references public.class (id) on delete set null,
  overall_average numeric(6, 2),
  overall_grade text,
  subjects jsonb not null default '[]'::jsonb,
  remarks text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (student_id, term_id)
);

create table public.timetable (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.class (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  period_no smallint not null check (period_no >= 1),
  subject_id uuid references public.subject (id) on delete set null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, day_of_week, period_no)
);

create index assessment_class_subject_idx on public.assessment (class_subject_id);
create index result_student_idx on public.result (student_id);
create index result_assessment_idx on public.result (assessment_id);
create index timetable_class_idx on public.timetable (class_id);

create trigger set_updated_at before update on public.assessment
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.result
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.report_card
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.timetable
  for each row execute function public.set_updated_at();

-- result is protected: audit every write.
create trigger audit_result
  after insert or update or delete on public.result
  for each row execute function public.audit_row();

-- ─────────────────────────────────────────────────────────────────────────
-- save_results — upsert results for an assessment. Authorized to the class's
-- teacher or admin. p_marks: [{ "student_id": uuid, "score": number }].
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.save_results(
  p_assessment_id uuid,
  p_marks jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_max numeric(6, 2);
  v_mark jsonb;
  v_score numeric(6, 2);
begin
  select cs.class_id, a.max_score
  into v_class_id, v_max
  from public.assessment a
  join public.class_subject cs on cs.id = a.class_subject_id
  where a.id = p_assessment_id;
  if v_class_id is null then
    raise exception 'assessment % not found', p_assessment_id;
  end if;

  if not (public.is_admin() or public.is_teacher_of_class(v_class_id)) then
    raise exception 'not authorized to enter results for this class';
  end if;

  for v_mark in select * from jsonb_array_elements(p_marks)
  loop
    v_score := (v_mark ->> 'score')::numeric;
    if v_score > v_max then
      raise exception 'score % exceeds the maximum %', v_score, v_max;
    end if;
    insert into public.result (assessment_id, student_id, score, created_by)
    values (p_assessment_id, (v_mark ->> 'student_id')::uuid, v_score, auth.uid())
    on conflict (assessment_id, student_id)
    do update set score = excluded.score, updated_at = now();
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- generate_report_card — assemble per-subject weighted percentages and an
-- overall average/grade for a student in a term. Authorized to admin or the
-- student's class teacher.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.generate_report_card(
  p_student_id uuid,
  p_term_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_subjects jsonb;
  v_overall numeric(6, 2);
  v_report_id uuid;
begin
  select e.class_id into v_class_id
  from public.enrolment e
  join public.term t on t.academic_year_id = e.academic_year_id
  where e.student_id = p_student_id and t.id = p_term_id and e.status = 'active'
  limit 1;

  if not (public.is_admin() or (v_class_id is not null and public.is_teacher_of_class(v_class_id))) then
    raise exception 'not authorized to generate this report card';
  end if;

  with subj as (
    select
      s.id as subject_id,
      s.name as subject,
      case when sum(a.weight) > 0
        then round(sum(r.score / a.max_score * a.weight) / sum(a.weight) * 100, 2)
        else null end as percent
    from public.class_subject cs
    join public.subject s on s.id = cs.subject_id
    left join public.assessment a
      on a.class_subject_id = cs.id and a.term_id = p_term_id
    left join public.result r
      on r.assessment_id = a.id and r.student_id = p_student_id
    where cs.class_id = v_class_id
    group by s.id, s.name
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'subject', subject,
          'percent', percent,
          'grade', case when percent is null then null else public.wassce_grade(percent) end
        )
        order by subject
      ) filter (where subject is not null),
      '[]'::jsonb
    ),
    round(avg(percent) filter (where percent is not null), 2)
  into v_subjects, v_overall
  from subj;

  insert into public.report_card
    (student_id, term_id, class_id, overall_average, overall_grade, subjects, created_by)
  values
    (p_student_id, p_term_id, v_class_id, v_overall,
     case when v_overall is null then null else public.wassce_grade(v_overall) end,
     coalesce(v_subjects, '[]'::jsonb), auth.uid())
  on conflict (student_id, term_id) do update
    set class_id = excluded.class_id,
        overall_average = excluded.overall_average,
        overall_grade = excluded.overall_grade,
        subjects = excluded.subjects,
        generated_at = now(),
        updated_at = now()
  returning id into v_report_id;

  return v_report_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['assessment', 'result', 'report_card', 'timetable']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end;
$$;

-- assessment: the class's teacher (or admin) manages.
create policy assessment_rw on public.assessment
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.class_subject cs
      where cs.id = assessment.class_subject_id
        and public.is_teacher_of_class(cs.class_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.class_subject cs
      where cs.id = assessment.class_subject_id
        and public.is_teacher_of_class(cs.class_id)
    )
  );

-- result: the class's teacher (or admin) writes; a parent may read their own
-- child's results.
create policy result_select on public.result
  for select to authenticated
  using (
    public.is_admin()
    or public.is_parent_of_student(student_id)
    or exists (
      select 1 from public.assessment a
      join public.class_subject cs on cs.id = a.class_subject_id
      where a.id = result.assessment_id
        and public.is_teacher_of_class(cs.class_id)
    )
  );

create policy result_write on public.result
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.assessment a
      join public.class_subject cs on cs.id = a.class_subject_id
      where a.id = result.assessment_id
        and public.is_teacher_of_class(cs.class_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.assessment a
      join public.class_subject cs on cs.id = a.class_subject_id
      where a.id = result.assessment_id
        and public.is_teacher_of_class(cs.class_id)
    )
  );

-- report_card: admin or the student's class teacher manage; parent reads own.
create policy report_card_select on public.report_card
  for select to authenticated
  using (
    public.is_admin()
    or public.is_parent_of_student(student_id)
    or (class_id is not null and public.is_teacher_of_class(class_id))
  );

create policy report_card_write on public.report_card
  for all to authenticated
  using (
    public.is_admin()
    or (class_id is not null and public.is_teacher_of_class(class_id))
  )
  with check (
    public.is_admin()
    or (class_id is not null and public.is_teacher_of_class(class_id))
  );

-- timetable: readable by any signed-in user; the class's teacher/admin edits.
create policy timetable_select on public.timetable
  for select to authenticated using (true);

create policy timetable_write on public.timetable
  for all to authenticated
  using (public.is_admin() or public.is_teacher_of_class(class_id))
  with check (public.is_admin() or public.is_teacher_of_class(class_id));

revoke all on function public.save_results(uuid, jsonb) from anon;
grant execute on function public.save_results(uuid, jsonb) to authenticated;
revoke all on function public.generate_report_card(uuid, uuid) from anon;
grant execute on function public.generate_report_card(uuid, uuid) to authenticated;
