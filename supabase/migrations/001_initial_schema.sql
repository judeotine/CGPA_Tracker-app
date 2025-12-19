-- CGPA Tracker App - Initial Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  university TEXT DEFAULT 'ISBAT University',
  program TEXT,
  country TEXT DEFAULT 'Uganda',
  student_id TEXT,
  start_year INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- SEMESTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  semester_number INTEGER NOT NULL,
  name TEXT,
  start_date DATE,
  end_date DATE,
  gpa DECIMAL(3,2),
  total_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

-- Semesters policies
CREATE POLICY "Users can view their own semesters"
  ON public.semesters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own semesters"
  ON public.semesters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own semesters"
  ON public.semesters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own semesters"
  ON public.semesters FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_semesters_user_id ON public.semesters(user_id);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  credit_hours INTEGER NOT NULL DEFAULT 4,
  ia_score DECIMAL(5,2),
  ia_max DECIMAL(5,2) DEFAULT 30,
  ue_score DECIMAL(5,2),
  ue_max DECIMAL(5,2) DEFAULT 70,
  total_score DECIMAL(5,2),
  percentage DECIMAL(5,2),
  grade TEXT,
  grade_points DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Users can view their own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_semester_id ON public.courses(semester_id);
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);

-- ============================================
-- PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  default_ia_max DECIMAL(5,2) DEFAULT 30,
  default_ue_max DECIMAL(5,2) DEFAULT 70,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_semesters_updated_at
  BEFORE UPDATE ON public.semesters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GRADE CALCULATION FUNCTION
-- ============================================

-- Function to get grade from percentage (Ugandan System)
CREATE OR REPLACE FUNCTION public.get_grade(percentage DECIMAL)
RETURNS TABLE(grade TEXT, grade_points DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN percentage >= 80 THEN 'A'
      WHEN percentage >= 75 THEN 'B+'
      WHEN percentage >= 70 THEN 'B'
      WHEN percentage >= 65 THEN 'C+'
      WHEN percentage >= 60 THEN 'C'
      WHEN percentage >= 55 THEN 'D+'
      WHEN percentage >= 50 THEN 'D'
      WHEN percentage >= 40 THEN 'E'
      ELSE 'F'
    END::TEXT,
    CASE
      WHEN percentage >= 80 THEN 5.0
      WHEN percentage >= 75 THEN 4.5
      WHEN percentage >= 70 THEN 4.0
      WHEN percentage >= 65 THEN 3.5
      WHEN percentage >= 60 THEN 3.0
      WHEN percentage >= 55 THEN 2.5
      WHEN percentage >= 50 THEN 2.0
      WHEN percentage >= 40 THEN 1.0
      ELSE 0.0
    END::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEMESTER GPA CALCULATION
-- ============================================

-- Function to calculate semester GPA
CREATE OR REPLACE FUNCTION public.calculate_semester_gpa(p_semester_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_weighted_points DECIMAL := 0;
  v_total_credits INTEGER := 0;
  v_gpa DECIMAL;
BEGIN
  SELECT
    COALESCE(SUM(grade_points * credit_hours), 0),
    COALESCE(SUM(credit_hours), 0)
  INTO v_total_weighted_points, v_total_credits
  FROM public.courses
  WHERE semester_id = p_semester_id
    AND grade_points IS NOT NULL;

  IF v_total_credits > 0 THEN
    v_gpa := ROUND(v_total_weighted_points / v_total_credits, 2);
  ELSE
    v_gpa := NULL;
  END IF;

  RETURN v_gpa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate CGPA for a user
CREATE OR REPLACE FUNCTION public.calculate_cgpa(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_weighted_points DECIMAL := 0;
  v_total_credits INTEGER := 0;
  v_cgpa DECIMAL;
BEGIN
  SELECT
    COALESCE(SUM(c.grade_points * c.credit_hours), 0),
    COALESCE(SUM(c.credit_hours), 0)
  INTO v_total_weighted_points, v_total_credits
  FROM public.courses c
  WHERE c.user_id = p_user_id
    AND c.grade_points IS NOT NULL;

  IF v_total_credits > 0 THEN
    v_cgpa := ROUND(v_total_weighted_points / v_total_credits, 2);
  ELSE
    v_cgpa := NULL;
  END IF;

  RETURN v_cgpa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update semester stats after course changes
CREATE OR REPLACE FUNCTION public.update_semester_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_semester_id UUID;
  v_gpa DECIMAL;
  v_total_credits INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_semester_id := OLD.semester_id;
  ELSE
    v_semester_id := NEW.semester_id;
  END IF;

  v_gpa := public.calculate_semester_gpa(v_semester_id);

  SELECT COALESCE(SUM(credit_hours), 0)
  INTO v_total_credits
  FROM public.courses
  WHERE semester_id = v_semester_id;

  UPDATE public.semesters
  SET
    gpa = v_gpa,
    total_credits = v_total_credits,
    updated_at = NOW()
  WHERE id = v_semester_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update semester stats
DROP TRIGGER IF EXISTS trigger_update_semester_stats ON public.courses;
CREATE TRIGGER trigger_update_semester_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_semester_stats();

-- ============================================
-- AUTO-CALCULATE COURSE GRADES
-- ============================================

-- Function to auto-calculate course grades before insert/update
CREATE OR REPLACE FUNCTION public.calculate_course_grades()
RETURNS TRIGGER AS $$
DECLARE
  v_grade_result RECORD;
BEGIN
  IF NEW.ia_score IS NOT NULL AND NEW.ue_score IS NOT NULL THEN
    NEW.total_score := NEW.ia_score + NEW.ue_score;
    NEW.percentage := ROUND((NEW.total_score / (NEW.ia_max + NEW.ue_max)) * 100, 2);
    SELECT * INTO v_grade_result FROM public.get_grade(NEW.percentage);
    NEW.grade := v_grade_result.grade;
    NEW.grade_points := v_grade_result.grade_points;
  ELSIF NEW.ia_score IS NOT NULL THEN
    NEW.total_score := NEW.ia_score;
    NEW.percentage := ROUND((NEW.ia_score / NEW.ia_max) * 100, 2);
    NEW.grade := NULL;
    NEW.grade_points := NULL;
  ELSIF NEW.ue_score IS NOT NULL THEN
    NEW.total_score := NEW.ue_score;
    NEW.percentage := ROUND((NEW.ue_score / NEW.ue_max) * 100, 2);
    NEW.grade := NULL;
    NEW.grade_points := NULL;
  ELSE
    NEW.total_score := NULL;
    NEW.percentage := NULL;
    NEW.grade := NULL;
    NEW.grade_points := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate course grades
DROP TRIGGER IF EXISTS trigger_calculate_course_grades ON public.courses;
CREATE TRIGGER trigger_calculate_course_grades
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_course_grades();

-- ============================================
-- ENABLE REALTIME
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'semesters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.semesters;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'courses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'preferences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.preferences;
  END IF;
END $$;

-- ============================================
-- DATA VALIDATION CONSTRAINTS
-- ============================================
ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_credit_hours_check,
  ADD CONSTRAINT courses_credit_hours_check CHECK (credit_hours > 0 AND credit_hours <= 10);

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_ia_score_check,
  ADD CONSTRAINT courses_ia_score_check CHECK (ia_score IS NULL OR ia_score >= 0);

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_ue_score_check,
  ADD CONSTRAINT courses_ue_score_check CHECK (ue_score IS NULL OR ue_score >= 0);

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_ia_max_check,
  ADD CONSTRAINT courses_ia_max_check CHECK (ia_max > 0);

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_ue_max_check,
  ADD CONSTRAINT courses_ue_max_check CHECK (ue_max > 0);

-- Unique constraint for semester numbers per user
ALTER TABLE public.semesters
  DROP CONSTRAINT IF EXISTS semesters_user_semester_unique,
  ADD CONSTRAINT semesters_user_semester_unique UNIQUE (user_id, semester_number);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
