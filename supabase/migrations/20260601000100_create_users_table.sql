-- ============================================================
-- Migration: 20260601000100_create_users_table
-- Creates: users table + auto-create trigger on auth.users
-- Depends on: (none — only auth.users which is Supabase-managed)
-- Rollback: rollback/rollback_20260601000100.sql
-- ============================================================

CREATE TABLE public.users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role         TEXT        NOT NULL DEFAULT 'user'
                           CHECK (role IN ('user', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile but cannot change role
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Admins can view all users
CREATE POLICY "users_admin_select_all" ON public.users
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

COMMENT ON TABLE  public.users IS 'User profiles synced from Supabase Auth';
COMMENT ON COLUMN public.users.role IS 'Controlled via app_metadata — users cannot self-elevate';

-- ── Auto-create user profile on first sign-in ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_app_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates user profile when a new Supabase Auth user signs up';
