-- Golden Ratio Clinics — Initial Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zdepsughnijknjcccmza/sql

-- ─── Bookings ───
-- Stores pre-screening call requests from patients
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  contact_method TEXT DEFAULT 'phone',
  message TEXT,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Quiz Submissions ───
-- Stores eligibility guide responses (anonymised, no PII)
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answers JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  result_category TEXT NOT NULL CHECK (result_category IN ('likely_eligible', 'possibly_eligible', 'not_eligible')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Contact Enquiries ───
-- General contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(email);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_enquiries(status);

-- ─── Row Level Security ───
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from the website) but no reads
CREATE POLICY "Allow anonymous booking inserts"
  ON public.bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous quiz inserts"
  ON public.quiz_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous contact inserts"
  ON public.contact_enquiries FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role (admin dashboard) can do everything
CREATE POLICY "Service role full access bookings"
  ON public.bookings FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access quiz"
  ON public.quiz_submissions FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access contact"
  ON public.contact_enquiries FOR ALL
  TO service_role
  USING (true);

-- ─── Updated at trigger ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
