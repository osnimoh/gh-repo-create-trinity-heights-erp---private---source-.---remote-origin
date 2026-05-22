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
    };
    CompositeTypes: Record<string, never>;
  };
};
