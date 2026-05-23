-- Workstream 5 — Fees & finance (GH₵). CRITICAL: the 10% net-fee floor.
--
-- Defence in depth for the entrenched rule "no scholarship or combination may
-- reduce net payable below 10% of the standard fee":
--   1. lib/fees/net-fee.ts        (app logic, unit-tested)
--   2. generate_invoice() RPC     (server logic, mirrors #1)
--   3. invoice CHECK constraint   (the DB backstop — cannot be bypassed)
-- `payment` is a protected table: every write is audited via audit_row().
-- Money is numeric(12,2) GH₵; never floats.

create type public.scholarship_kind as enum ('percentage', 'fixed');
create type public.payment_method as enum ('momo', 'bank', 'cash');
create type public.invoice_status as enum (
  'unpaid', 'part_paid', 'paid', 'void'
);

-- ─────────────────────────────────────────────────────────────────────────
-- Standard fee per (year, year_group). Per-term standard amount in GH₵.
-- ─────────────────────────────────────────────────────────────────────────
create table public.fee_structure (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_year (id) on delete cascade,
  year_group public.year_group not null,
  amount numeric(12, 2) not null check (amount >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, year_group)
);

create table public.scholarship (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  name text not null,
  kind public.scholarship_kind not null,
  value numeric(12, 2) not null check (value >= 0),
  academic_year_id uuid references public.academic_year (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- invoice — per student per term. The floor is enforced HERE by CHECK.
-- ─────────────────────────────────────────────────────────────────────────
create table public.invoice (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  term_id uuid not null references public.term (id) on delete restrict,
  academic_year_id uuid references public.academic_year (id) on delete set null,
  standard_amount numeric(12, 2) not null check (standard_amount >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  net_amount numeric(12, 2) not null check (net_amount >= 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  status public.invoice_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (student_id, term_id),
  -- net must equal standard minus discount …
  constraint invoice_net_consistent
    check (net_amount = standard_amount - discount_amount),
  -- … and may NEVER fall below 10% of the standard fee (the entrenched floor).
  constraint invoice_ten_percent_floor
    check (net_amount >= standard_amount * 0.10)
);

create table public.payment (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoice (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_method not null,
  reference text,
  paid_on date not null default current_date,
  received_by_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index scholarship_student_idx on public.scholarship (student_id);
create index invoice_student_idx on public.invoice (student_id);
create index payment_invoice_idx on public.payment (invoice_id);

create trigger set_updated_at before update on public.fee_structure
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.scholarship
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.invoice
  for each row execute function public.set_updated_at();

-- Audit every payment write (protected table).
create trigger audit_payment
  after insert or update or delete on public.payment
  for each row execute function public.audit_row();

-- ─────────────────────────────────────────────────────────────────────────
-- generate_invoice — compute standard/discount/net with the 10% floor and
-- upsert the invoice. Authorized to admin/bursary. Mirrors net-fee.ts.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.generate_invoice(
  p_student_id uuid,
  p_term_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year_group public.year_group;
  v_academic_year_id uuid;
  v_standard numeric(12, 2);
  v_pct numeric(12, 2);
  v_fixed numeric(12, 2);
  v_raw_discount numeric(12, 2);
  v_min_net numeric(12, 2);
  v_net numeric(12, 2);
  v_discount numeric(12, 2);
  v_invoice_id uuid;
begin
  if not (public.is_admin() or public.has_role('bursary')) then
    raise exception 'not authorized to generate invoices';
  end if;

  select t.academic_year_id into v_academic_year_id
  from public.term t where t.id = p_term_id;
  if v_academic_year_id is null then
    raise exception 'term % not found', p_term_id;
  end if;

  select s.year_group into v_year_group
  from public.student s where s.id = p_student_id;

  select fs.amount into v_standard
  from public.fee_structure fs
  where fs.academic_year_id = v_academic_year_id
    and fs.year_group = v_year_group;
  if v_standard is null then
    raise exception 'no fee structure for this year/year-group';
  end if;

  select
    coalesce(sum(case when kind = 'percentage' then value else 0 end), 0),
    coalesce(sum(case when kind = 'fixed' then value else 0 end), 0)
  into v_pct, v_fixed
  from public.scholarship
  where student_id = p_student_id
    and active
    and (academic_year_id is null or academic_year_id = v_academic_year_id);

  v_raw_discount := round(v_standard * v_pct / 100, 2) + v_fixed;

  -- Floor rounded UP to the pesewa so net is always >= standard * 0.10.
  v_min_net := ceil(v_standard * 0.10 * 100) / 100;

  v_net := v_standard - v_raw_discount;
  if v_net < v_min_net then v_net := v_min_net; end if;
  if v_net > v_standard then v_net := v_standard; end if;
  v_discount := v_standard - v_net;

  insert into public.invoice
    (student_id, term_id, academic_year_id, standard_amount,
     discount_amount, net_amount, created_by)
  values
    (p_student_id, p_term_id, v_academic_year_id, v_standard,
     v_discount, v_net, auth.uid())
  on conflict (student_id, term_id) do update
    set standard_amount = excluded.standard_amount,
        discount_amount = excluded.discount_amount,
        net_amount = excluded.net_amount,
        updated_at = now()
  returning id into v_invoice_id;

  return v_invoice_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- record_payment — insert a payment and recompute the invoice's paid/status.
-- Authorized to admin/bursary. The payment insert is audited by the trigger.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method public.payment_method,
  p_reference text default null,
  p_paid_on date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_net numeric(12, 2);
  v_paid numeric(12, 2);
begin
  if not (public.is_admin() or public.has_role('bursary')) then
    raise exception 'not authorized to record payments';
  end if;

  insert into public.payment (invoice_id, amount, method, reference, paid_on, created_by)
  values (p_invoice_id, p_amount, p_method, p_reference, p_paid_on, auth.uid())
  returning id into v_payment_id;

  select net_amount into v_net from public.invoice where id = p_invoice_id;
  select coalesce(sum(amount), 0) into v_paid
  from public.payment where invoice_id = p_invoice_id;

  update public.invoice
     set amount_paid = v_paid,
         status = case
           when v_paid >= v_net then 'paid'
           when v_paid > 0 then 'part_paid'
           else 'unpaid'
         end
   where id = p_invoice_id;

  return v_payment_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — money is tightest. admin/bursary manage; parents read their own
-- child's invoices/payments; nobody else (no fees for teacher/nurse/dsl).
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['fee_structure', 'scholarship', 'invoice', 'payment']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end;
$$;

create policy fee_structure_rw on public.fee_structure
  for all to authenticated
  using (public.is_admin() or public.has_role('bursary'))
  with check (public.is_admin() or public.has_role('bursary'));

create policy scholarship_rw on public.scholarship
  for all to authenticated
  using (public.is_admin() or public.has_role('bursary'))
  with check (public.is_admin() or public.has_role('bursary'));

create policy invoice_select on public.invoice
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('bursary')
    or public.is_parent_of_student(student_id)
  );
create policy invoice_write on public.invoice
  for all to authenticated
  using (public.is_admin() or public.has_role('bursary'))
  with check (public.is_admin() or public.has_role('bursary'));

create policy payment_select on public.payment
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('bursary')
    or exists (
      select 1 from public.invoice i
      where i.id = payment.invoice_id
        and public.is_parent_of_student(i.student_id)
    )
  );
create policy payment_write on public.payment
  for all to authenticated
  using (public.is_admin() or public.has_role('bursary'))
  with check (public.is_admin() or public.has_role('bursary'));

revoke all on function public.generate_invoice(uuid, uuid) from anon;
grant execute on function public.generate_invoice(uuid, uuid) to authenticated;
revoke all on function public.record_payment(uuid, numeric, public.payment_method, text, date) from anon;
grant execute on function public.record_payment(uuid, numeric, public.payment_method, text, date) to authenticated;
