-- FIX RLS Performance Issue for notifications table
-- Replace auth.uid() with (select auth.uid()) to evaluate only once per query
-- 
-- ISSUE: auth.uid() is re-evaluated for EACH ROW in the table
-- FIX: (SELECT auth.uid()) is evaluated ONCE per query (scalar subquery optimization)
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql

-- ============================================
-- DROP OLD POLICIES (re-evaluated per row)
-- ============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- ============================================
-- CREATE OPTIMIZED POLICIES (evaluated once)
-- ============================================

-- SELECT policy - users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- INSERT policy - users can only insert notifications for themselves
CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE policy - users can only update their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (user_id = (SELECT auth.uid()));

-- DELETE policy - users can only delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE
    USING (user_id = (SELECT auth.uid()));

-- ============================================
-- VERIFY THE FIX
-- ============================================
-- Run this query to check the new policies:
-- SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'notifications';
