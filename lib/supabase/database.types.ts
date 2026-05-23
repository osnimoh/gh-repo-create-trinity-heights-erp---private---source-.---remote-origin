// Hand-authored to match /supabase/migrations until the project runs against a
// live Supabase (Docker or hosted). Once it does, REGENERATE with:
//   npm run gen:types
// and stop hand-editing — the generator overwrites this file. Keep in sync with
// the migrations in the meantime.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      person: {
        Row: Timestamps & {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          preferred_name: string | null;
          date_of_birth: string | null;
          sex: Database["public"]["Enums"]["sex"] | null;
          email: string | null;
          phone: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name: string;
          preferred_name?: string | null;
          date_of_birth?: string | null;
          sex?: Database["public"]["Enums"]["sex"] | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          preferred_name?: string | null;
          date_of_birth?: string | null;
          sex?: Database["public"]["Enums"]["sex"] | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      student: {
        Row: Timestamps & {
          id: string;
          person_id: string;
          admission_no: string | null;
          stream: Database["public"]["Enums"]["stream"] | null;
          track: Database["public"]["Enums"]["track"] | null;
          year_group: Database["public"]["Enums"]["year_group"] | null;
          status: Database["public"]["Enums"]["student_status"];
          enrolled_on: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          person_id: string;
          admission_no?: string | null;
          stream?: Database["public"]["Enums"]["stream"] | null;
          track?: Database["public"]["Enums"]["track"] | null;
          year_group?: Database["public"]["Enums"]["year_group"] | null;
          status?: Database["public"]["Enums"]["student_status"];
          enrolled_on?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          person_id?: string;
          admission_no?: string | null;
          stream?: Database["public"]["Enums"]["stream"] | null;
          track?: Database["public"]["Enums"]["track"] | null;
          year_group?: Database["public"]["Enums"]["year_group"] | null;
          status?: Database["public"]["Enums"]["student_status"];
          enrolled_on?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      guardian: {
        Row: Timestamps & {
          id: string;
          person_id: string;
          occupation: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          person_id: string;
          occupation?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          person_id?: string;
          occupation?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guardian_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      student_guardian: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          guardian_id: string;
          relationship:
            | Database["public"]["Enums"]["guardian_relationship"]
            | null;
          is_primary: boolean;
          is_authorised_collector: boolean;
          can_top_up_wallet: boolean;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          guardian_id: string;
          relationship?:
            | Database["public"]["Enums"]["guardian_relationship"]
            | null;
          is_primary?: boolean;
          is_authorised_collector?: boolean;
          can_top_up_wallet?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          guardian_id?: string;
          relationship?:
            | Database["public"]["Enums"]["guardian_relationship"]
            | null;
          is_primary?: boolean;
          is_authorised_collector?: boolean;
          can_top_up_wallet?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_guardian_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_guardian_guardian_id_fkey";
            columns: ["guardian_id"];
            referencedRelation: "guardian";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: Timestamps & {
          id: string;
          person_id: string;
          staff_no: string | null;
          job_title: string | null;
          department: string | null;
          is_active: boolean;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          person_id: string;
          staff_no?: string | null;
          job_title?: string | null;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          person_id?: string;
          staff_no?: string | null;
          job_title?: string | null;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      academic_year: {
        Row: Timestamps & {
          id: string;
          name: string;
          starts_on: string | null;
          ends_on: string | null;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      term: {
        Row: Timestamps & {
          id: string;
          academic_year_id: string;
          number: number;
          name: string | null;
          starts_on: string | null;
          ends_on: string | null;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          academic_year_id: string;
          number: number;
          name?: string | null;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academic_year_id?: string;
          number?: number;
          name?: string | null;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "term_academic_year_id_fkey";
            columns: ["academic_year_id"];
            referencedRelation: "academic_year";
            referencedColumns: ["id"];
          },
        ];
      };
      house: {
        Row: Timestamps & {
          id: string;
          name: string;
          motto: string | null;
          colour: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          motto?: string | null;
          colour?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          motto?: string | null;
          colour?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class: {
        Row: Timestamps & {
          id: string;
          academic_year_id: string;
          year_group: Database["public"]["Enums"]["year_group"];
          stream: Database["public"]["Enums"]["stream"] | null;
          name: string;
          form_teacher_staff_id: string | null;
        };
        Insert: {
          id?: string;
          academic_year_id: string;
          year_group: Database["public"]["Enums"]["year_group"];
          stream?: Database["public"]["Enums"]["stream"] | null;
          name: string;
          form_teacher_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academic_year_id?: string;
          year_group?: Database["public"]["Enums"]["year_group"];
          stream?: Database["public"]["Enums"]["stream"] | null;
          name?: string;
          form_teacher_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_academic_year_id_fkey";
            columns: ["academic_year_id"];
            referencedRelation: "academic_year";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_form_teacher_staff_id_fkey";
            columns: ["form_teacher_staff_id"];
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      subject: {
        Row: Timestamps & {
          id: string;
          code: string | null;
          name: string;
          is_core: boolean;
        };
        Insert: {
          id?: string;
          code?: string | null;
          name: string;
          is_core?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string | null;
          name?: string;
          is_core?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_subject: {
        Row: Timestamps & {
          id: string;
          class_id: string;
          subject_id: string;
          teacher_staff_id: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          subject_id: string;
          teacher_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          subject_id?: string;
          teacher_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_subject_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_subject_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subject";
            referencedColumns: ["id"];
          },
        ];
      };
      application: {
        Row: Timestamps & {
          id: string;
          person_id: string;
          academic_year_id: string | null;
          stream: Database["public"]["Enums"]["stream"] | null;
          track: Database["public"]["Enums"]["track"] | null;
          exam_score: number | null;
          status: Database["public"]["Enums"]["application_status"];
          submitted_on: string;
          decided_on: string | null;
          notes: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          person_id: string;
          academic_year_id?: string | null;
          stream?: Database["public"]["Enums"]["stream"] | null;
          track?: Database["public"]["Enums"]["track"] | null;
          exam_score?: number | null;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_on?: string;
          decided_on?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          person_id?: string;
          academic_year_id?: string | null;
          stream?: Database["public"]["Enums"]["stream"] | null;
          track?: Database["public"]["Enums"]["track"] | null;
          exam_score?: number | null;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_on?: string;
          decided_on?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "application_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      enrolment: {
        Row: Timestamps & {
          id: string;
          application_id: string | null;
          student_id: string;
          academic_year_id: string;
          class_id: string | null;
          house_id: string | null;
          enrolled_on: string;
          status: Database["public"]["Enums"]["enrolment_status"];
          created_by: string | null;
        };
        Insert: {
          id?: string;
          application_id?: string | null;
          student_id: string;
          academic_year_id: string;
          class_id?: string | null;
          house_id?: string | null;
          enrolled_on?: string;
          status?: Database["public"]["Enums"]["enrolment_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string | null;
          student_id?: string;
          academic_year_id?: string;
          class_id?: string | null;
          house_id?: string | null;
          enrolled_on?: string;
          status?: Database["public"]["Enums"]["enrolment_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrolment_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrolment_application_id_fkey";
            columns: ["application_id"];
            referencedRelation: "application";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrolment_academic_year_id_fkey";
            columns: ["academic_year_id"];
            referencedRelation: "academic_year";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrolment_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrolment_house_id_fkey";
            columns: ["house_id"];
            referencedRelation: "house";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_session: {
        Row: Timestamps & {
          id: string;
          class_id: string;
          session_date: string;
          session_type: Database["public"]["Enums"]["attendance_session_type"];
          taken_by_staff_id: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          session_date?: string;
          session_type?: Database["public"]["Enums"]["attendance_session_type"];
          taken_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string;
          session_date?: string;
          session_type?: Database["public"]["Enums"]["attendance_session_type"];
          taken_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_session_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_mark: {
        Row: Timestamps & {
          id: string;
          attendance_session_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          note: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          attendance_session_id: string;
          student_id: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          note?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          attendance_session_id?: string;
          student_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          note?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_mark_attendance_session_id_fkey";
            columns: ["attendance_session_id"];
            referencedRelation: "attendance_session";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_mark_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
        ];
      };
      boarding_roll: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          house_id: string | null;
          roll_date: string;
          session: Database["public"]["Enums"]["boarding_session"];
          present: boolean;
          note: string | null;
          taken_by_staff_id: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          house_id?: string | null;
          roll_date?: string;
          session?: Database["public"]["Enums"]["boarding_session"];
          present?: boolean;
          note?: string | null;
          taken_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          house_id?: string | null;
          roll_date?: string;
          session?: Database["public"]["Enums"]["boarding_session"];
          present?: boolean;
          note?: string | null;
          taken_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "boarding_roll_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "boarding_roll_house_id_fkey";
            columns: ["house_id"];
            referencedRelation: "house";
            referencedColumns: ["id"];
          },
        ];
      };
      exeat: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          collector_guardian_id: string | null;
          reason: string | null;
          departure_at: string | null;
          expected_return_at: string | null;
          actual_return_at: string | null;
          status: Database["public"]["Enums"]["exeat_status"];
          approved_by_staff_id: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          collector_guardian_id?: string | null;
          reason?: string | null;
          departure_at?: string | null;
          expected_return_at?: string | null;
          actual_return_at?: string | null;
          status?: Database["public"]["Enums"]["exeat_status"];
          approved_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          collector_guardian_id?: string | null;
          reason?: string | null;
          departure_at?: string | null;
          expected_return_at?: string | null;
          actual_return_at?: string | null;
          status?: Database["public"]["Enums"]["exeat_status"];
          approved_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exeat_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exeat_collector_guardian_id_fkey";
            columns: ["collector_guardian_id"];
            referencedRelation: "guardian";
            referencedColumns: ["id"];
          },
        ];
      };
      fee_structure: {
        Row: Timestamps & {
          id: string;
          academic_year_id: string;
          year_group: Database["public"]["Enums"]["year_group"];
          amount: number;
          description: string | null;
        };
        Insert: {
          id?: string;
          academic_year_id: string;
          year_group: Database["public"]["Enums"]["year_group"];
          amount: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academic_year_id?: string;
          year_group?: Database["public"]["Enums"]["year_group"];
          amount?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fee_structure_academic_year_id_fkey";
            columns: ["academic_year_id"];
            referencedRelation: "academic_year";
            referencedColumns: ["id"];
          },
        ];
      };
      scholarship: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          name: string;
          kind: Database["public"]["Enums"]["scholarship_kind"];
          value: number;
          academic_year_id: string | null;
          active: boolean;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          kind: Database["public"]["Enums"]["scholarship_kind"];
          value: number;
          academic_year_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          kind?: Database["public"]["Enums"]["scholarship_kind"];
          value?: number;
          academic_year_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scholarship_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          term_id: string;
          academic_year_id: string | null;
          standard_amount: number;
          discount_amount: number;
          net_amount: number;
          amount_paid: number;
          status: Database["public"]["Enums"]["invoice_status"];
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          term_id: string;
          academic_year_id?: string | null;
          standard_amount: number;
          discount_amount?: number;
          net_amount: number;
          amount_paid?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          term_id?: string;
          academic_year_id?: string | null;
          standard_amount?: number;
          discount_amount?: number;
          net_amount?: number;
          amount_paid?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_term_id_fkey";
            columns: ["term_id"];
            referencedRelation: "term";
            referencedColumns: ["id"];
          },
        ];
      };
      payment: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          method: Database["public"]["Enums"]["payment_method"];
          reference: string | null;
          paid_on: string;
          received_by_staff_id: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          method: Database["public"]["Enums"]["payment_method"];
          reference?: string | null;
          paid_on?: string;
          received_by_staff_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          amount?: number;
          method?: Database["public"]["Enums"]["payment_method"];
          reference?: string | null;
          paid_on?: string;
          received_by_staff_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoice";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment: {
        Row: Timestamps & {
          id: string;
          class_subject_id: string;
          term_id: string;
          name: string;
          max_score: number;
          weight: number;
          assessment_date: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          class_subject_id: string;
          term_id: string;
          name: string;
          max_score?: number;
          weight?: number;
          assessment_date?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          class_subject_id?: string;
          term_id?: string;
          name?: string;
          max_score?: number;
          weight?: number;
          assessment_date?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_class_subject_id_fkey";
            columns: ["class_subject_id"];
            referencedRelation: "class_subject";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_term_id_fkey";
            columns: ["term_id"];
            referencedRelation: "term";
            referencedColumns: ["id"];
          },
        ];
      };
      result: {
        Row: Timestamps & {
          id: string;
          assessment_id: string;
          student_id: string;
          score: number;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          student_id: string;
          score: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          student_id?: string;
          score?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "result_assessment_id_fkey";
            columns: ["assessment_id"];
            referencedRelation: "assessment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
        ];
      };
      report_card: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          term_id: string;
          class_id: string | null;
          overall_average: number | null;
          overall_grade: string | null;
          subjects: Json;
          remarks: string | null;
          generated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          term_id: string;
          class_id?: string | null;
          overall_average?: number | null;
          overall_grade?: string | null;
          subjects?: Json;
          remarks?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          term_id?: string;
          class_id?: string | null;
          overall_average?: number | null;
          overall_grade?: string | null;
          subjects?: Json;
          remarks?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_card_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_card_term_id_fkey";
            columns: ["term_id"];
            referencedRelation: "term";
            referencedColumns: ["id"];
          },
        ];
      };
      timetable: {
        Row: Timestamps & {
          id: string;
          class_id: string;
          day_of_week: number;
          period_no: number;
          subject_id: string | null;
          room: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          day_of_week: number;
          period_no: number;
          subject_id?: string | null;
          room?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          day_of_week?: number;
          period_no?: number;
          subject_id?: string | null;
          room?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timetable_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subject";
            referencedColumns: ["id"];
          },
        ];
      };
      health_record: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          blood_group: string | null;
          allergies: string | null;
          conditions: string | null;
          medications: string | null;
          notes: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          blood_group?: string | null;
          allergies?: string | null;
          conditions?: string | null;
          medications?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          blood_group?: string | null;
          allergies?: string | null;
          conditions?: string | null;
          medications?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "health_record_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
        ];
      };
      sick_bay_visit: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          visited_at: string;
          complaint: string | null;
          treatment: string | null;
          outcome: string | null;
          seen_by_staff_id: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          visited_at?: string;
          complaint?: string | null;
          treatment?: string | null;
          outcome?: string | null;
          seen_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          visited_at?: string;
          complaint?: string | null;
          treatment?: string | null;
          outcome?: string | null;
          seen_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sick_bay_visit_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
        ];
      };
      safeguarding_flag: {
        Row: Timestamps & {
          id: string;
          student_id: string;
          category: string;
          severity: Database["public"]["Enums"]["safeguarding_severity"];
          details: string | null;
          status: Database["public"]["Enums"]["safeguarding_status"];
          raised_by: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          category: string;
          severity?: Database["public"]["Enums"]["safeguarding_severity"];
          details?: string | null;
          status?: Database["public"]["Enums"]["safeguarding_status"];
          raised_by?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          category?: string;
          severity?: Database["public"]["Enums"]["safeguarding_severity"];
          details?: string | null;
          status?: Database["public"]["Enums"]["safeguarding_status"];
          raised_by?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "safeguarding_flag_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "student";
            referencedColumns: ["id"];
          },
        ];
      };
      message: {
        Row: {
          id: string;
          subject: string;
          body: string;
          audience: Database["public"]["Enums"]["message_audience"];
          class_id: string | null;
          target_user_id: string | null;
          send_email: boolean;
          send_sms: boolean;
          sender_user_id: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          subject: string;
          body: string;
          audience: Database["public"]["Enums"]["message_audience"];
          class_id?: string | null;
          target_user_id?: string | null;
          send_email?: boolean;
          send_sms?: boolean;
          sender_user_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          subject?: string;
          body?: string;
          audience?: Database["public"]["Enums"]["message_audience"];
          class_id?: string | null;
          target_user_id?: string | null;
          send_email?: boolean;
          send_sms?: boolean;
          sender_user_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      notification: {
        Row: {
          id: string;
          message_id: string | null;
          user_id: string;
          channel: Database["public"]["Enums"]["notification_channel"];
          status: Database["public"]["Enums"]["notification_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id?: string | null;
          user_id: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          status?: Database["public"]["Enums"]["notification_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string | null;
          user_id?: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          status?: Database["public"]["Enums"]["notification_status"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_message_id_fkey";
            columns: ["message_id"];
            referencedRelation: "message";
            referencedColumns: ["id"];
          },
        ];
      };
      acknowledgement: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          acknowledged_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          acknowledged_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          acknowledged_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "acknowledgement_message_id_fkey";
            columns: ["message_id"];
            referencedRelation: "message";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          occurred_at: string;
          actor_user_id: string | null;
          action: string;
          table_name: string;
          row_id: string | null;
          detail: Json | null;
        };
        Insert: {
          id?: string;
          occurred_at?: string;
          actor_user_id?: string | null;
          action: string;
          table_name: string;
          row_id?: string | null;
          detail?: Json | null;
        };
        Update: {
          id?: string;
          occurred_at?: string;
          actor_user_id?: string | null;
          action?: string;
          table_name?: string;
          row_id?: string | null;
          detail?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
      current_roles: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["app_role"][];
      };
      current_person_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_parent_of_student: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
      is_teacher_of_student: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
      can_read_all_identity: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      next_admission_no: {
        Args: { p_year: number };
        Returns: string;
      };
      enrol_applicant: {
        Args: {
          p_application_id: string;
          p_academic_year_id: string;
          p_class_id?: string;
          p_house_id?: string;
        };
        Returns: { student_id: string; admission_no: string }[];
      };
      current_staff_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_teacher_of_class: {
        Args: { p_class_id: string };
        Returns: boolean;
      };
      save_attendance: {
        Args: {
          p_class_id: string;
          p_session_date: string;
          p_session_type: Database["public"]["Enums"]["attendance_session_type"];
          p_marks: Json;
        };
        Returns: string;
      };
      generate_invoice: {
        Args: { p_student_id: string; p_term_id: string };
        Returns: string;
      };
      record_payment: {
        Args: {
          p_invoice_id: string;
          p_amount: number;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_reference?: string;
          p_paid_on?: string;
        };
        Returns: string;
      };
      wassce_grade: {
        Args: { p_percent: number };
        Returns: string;
      };
      save_results: {
        Args: { p_assessment_id: string; p_marks: Json };
        Returns: undefined;
      };
      generate_report_card: {
        Args: { p_student_id: string; p_term_id: string };
        Returns: string;
      };
      catering_allergies: {
        Args: Record<string, never>;
        Returns: {
          student_id: string;
          full_name: string;
          allergies: string | null;
        }[];
      };
    };
    Enums: {
      sex: "male" | "female";
      stream: "science" | "general_arts" | "business";
      track: "wassce" | "wassce_igcse";
      year_group: "shs1" | "shs2" | "shs3";
      student_status:
        | "prospective"
        | "enrolled"
        | "withdrawn"
        | "graduated"
        | "dismissed";
      guardian_relationship:
        | "mother"
        | "father"
        | "grandparent"
        | "aunt_uncle"
        | "sibling"
        | "guardian"
        | "other";
      app_role:
        | "admin"
        | "teacher"
        | "form_teacher"
        | "house_staff"
        | "bursary"
        | "nurse"
        | "dsl"
        | "admissions"
        | "parent";
      application_status:
        | "submitted"
        | "exam_taken"
        | "offered"
        | "accepted"
        | "enrolled"
        | "rejected"
        | "withdrawn";
      enrolment_status: "active" | "withdrawn" | "graduated" | "transferred";
      attendance_status: "present" | "absent" | "late" | "excused";
      attendance_session_type: "morning" | "afternoon" | "prep";
      boarding_session: "morning" | "evening";
      exeat_status:
        | "requested"
        | "approved"
        | "denied"
        | "departed"
        | "returned"
        | "cancelled";
      scholarship_kind: "percentage" | "fixed";
      payment_method: "momo" | "bank" | "cash";
      invoice_status: "unpaid" | "part_paid" | "paid" | "void";
      safeguarding_severity: "low" | "medium" | "high";
      safeguarding_status: "open" | "monitoring" | "closed";
      message_audience: "all_parents" | "all_staff" | "class" | "individual";
      notification_channel: "in_app" | "email" | "sms";
      notification_status: "queued" | "sent" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};
