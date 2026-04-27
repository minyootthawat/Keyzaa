-- Migration: Create admin management tables
-- Run against existing KeyZaa project

-- Admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'ops_admin', 'support_admin', 'catalog_admin')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin IP allowlist table
CREATE TABLE IF NOT EXISTS public.admin_ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all 3 tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ip_allowlist ENABLE ROW LEVEL SECURITY;

-- RLS policies: service role has full access
CREATE POLICY "service_role_all_admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_admin_audit_log" ON public.admin_audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_admin_ip_allowlist" ON public.admin_ip_allowlist FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_admins_user_id ON public.admins(user_id);
CREATE INDEX idx_admins_role ON public.admins(role);
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX idx_admin_ip_allowlist_ip_address ON public.admin_ip_allowlist(ip_address);
CREATE INDEX idx_admin_ip_allowlist_is_active ON public.admin_ip_allowlist(is_active);

-- Trigger: updated_at for admins
CREATE TRIGGER admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
