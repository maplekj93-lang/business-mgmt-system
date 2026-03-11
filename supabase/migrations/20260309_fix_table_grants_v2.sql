-- Migration: 20260309_fix_table_grants_v2.sql
-- Purpose: Grant necessary permissions to anon and authenticated roles for core business tables
-- and ensure RLS policies are correctly configured for the clients table.
-- 1. Grant schema usage
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
-- 2. Grant ALL permissions on core business tables to authenticated users
GRANT ALL ON TABLE public.clients TO authenticated,
    service_role;
GRANT ALL ON TABLE public.projects TO authenticated,
    service_role;
GRANT ALL ON TABLE public.project_incomes TO authenticated,
    service_role;
GRANT ALL ON TABLE public.daily_rate_logs TO authenticated,
    service_role;
GRANT ALL ON TABLE public.business_profiles TO authenticated,
    service_role;
GRANT ALL ON TABLE public.crew_payments TO authenticated,
    service_role;
GRANT ALL ON TABLE public.site_expenses TO authenticated,
    service_role;
GRANT ALL ON TABLE public.mdt_allocation_rules TO authenticated,
    service_role;
GRANT ALL ON TABLE public.mdt_import_mappings TO authenticated,
    service_role;
GRANT ALL ON TABLE public.import_batches TO authenticated,
    service_role;
-- 3. Grant SELECT permissions to anon (if needed for any public views, otherwise authenticated is enough)
GRANT SELECT ON TABLE public.clients TO anon;
GRANT SELECT ON TABLE public.projects TO anon;
-- 4. Grant ALL on sequences (crucial for SERIAL/auto-increment columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated,
    service_role;
-- 5. Refine RLS Policies for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.clients;
CREATE POLICY "authenticated_all" ON public.clients FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- 6. Refine RLS Policies for other core tables as well (ensure they have WITH CHECK)
DROP POLICY IF EXISTS "authenticated_all" ON public.projects;
CREATE POLICY "authenticated_all" ON public.projects FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated_all" ON public.project_incomes;
CREATE POLICY "authenticated_all" ON public.project_incomes FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "authenticated_all" ON public.daily_rate_logs;
CREATE POLICY "authenticated_all" ON public.daily_rate_logs FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');