/**
 * Auto-generated Database types from Supabase schema.
 *
 * To regenerate after a migration:
 *   npx supabase gen types typescript --project-id zdepsughnijknjcccmza > src/lib/database.types.ts
 *
 * Or via the Supabase MCP tool:
 *   mcp__plugin_supabase_supabase__generate_typescript_types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      patient_profiles: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          avatar_url: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          eligibility_notes: string | null;
          eligibility_status: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          preferred_name: string | null;
          state: string | null;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          eligibility_notes?: string | null;
          eligibility_status?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          preferred_name?: string | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["patient_profiles"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          appointment_type: string;
          clinical_notes: string | null;
          contact_method: string | null;
          created_at: string | null;
          duration_minutes: number | null;
          id: string;
          patient_notes: string | null;
          practitioner_name: string | null;
          practitioner_role: string | null;
          scheduled_at: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          appointment_type?: string;
          clinical_notes?: string | null;
          contact_method?: string | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          id?: string;
          patient_notes?: string | null;
          practitioner_name?: string | null;
          practitioner_role?: string | null;
          scheduled_at: string;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      prescriptions: {
        Row: {
          created_at: string | null;
          delivery_status: string | null;
          expiry_date: string | null;
          id: string;
          internal_notes: string | null;
          issued_date: string | null;
          next_review_date: string | null;
          patient_visible_notes: string | null;
          pharmacy_name: string | null;
          prescribing_doctor: string | null;
          prescription_reference: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          delivery_status?: string | null;
          expiry_date?: string | null;
          id?: string;
          internal_notes?: string | null;
          issued_date?: string | null;
          next_review_date?: string | null;
          patient_visible_notes?: string | null;
          pharmacy_name?: string | null;
          prescribing_doctor?: string | null;
          prescription_reference?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
    };
  };
};

export type PatientProfile =
  Database["public"]["Tables"]["patient_profiles"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Prescription =
  Database["public"]["Tables"]["prescriptions"]["Row"];

/** Eligibility status enum (mirrors the DB CHECK constraint) */
export const ELIGIBILITY_STATUS = {
  pending: "pending",
  under_review: "under_review",
  approved: "approved",
  declined: "declined",
  requires_followup: "requires_followup",
} as const;

export type EligibilityStatus = keyof typeof ELIGIBILITY_STATUS;

/** Human-readable labels for the dashboard UI */
export const ELIGIBILITY_LABELS: Record<string, { label: string; tone: "neutral" | "info" | "success" | "warn" | "danger" }> = {
  pending: { label: "Pre-Screening Required", tone: "neutral" },
  under_review: { label: "Under Clinical Review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  requires_followup: { label: "Follow-Up Required", tone: "warn" },
  declined: { label: "Not Eligible", tone: "danger" },
};
