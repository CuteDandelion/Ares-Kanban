-- Migration: 003_fix_infinite_recursion_policies
-- Description: Fix infinite recursion in RLS policies and add security definer functions
-- Created: 2026-01-28
-- Issue: Infinite recursion detected in policy for relation "organization_members"

-- ============================================
-- 1. SECURITY DEFINER FUNCTIONS (BYPASS RLS)
-- ============================================

-- Function to check if user is member of organization (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_organization_member(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM organization_members om
        WHERE om.user_id = p_user_id 
        AND om.organization_id = p_org_id
    );
END;
$$;

-- Function to check if user can access board (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.can_access_board(p_user_id UUID, p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM board_members bm
        WHERE bm.user_id = p_user_id 
        AND bm.board_id = p_board_id
    );
END;
$$;

-- Function to check if user has specific role on board
CREATE OR REPLACE FUNCTION public.has_board_role(p_user_id UUID, p_board_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM board_members bm
        WHERE bm.user_id = p_user_id 
        AND bm.board_id = p_board_id
        AND bm.role = ANY(p_roles)
    );
END;
$$;

-- Function to check if user is organization owner
CREATE OR REPLACE FUNCTION public.is_organization_owner(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM organizations o
        WHERE o.id = p_org_id 
        AND o.owner_id = p_user_id
    );
END;
$$;

-- Function to check if user can view card (through board membership)
CREATE OR REPLACE FUNCTION public.can_view_card(p_user_id UUID, p_card_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM cards c
        JOIN board_members bm ON c.board_id = bm.board_id
        WHERE c.id = p_card_id 
        AND bm.user_id = p_user_id
    );
END;
$$;

-- Function to check if user can edit card
CREATE OR REPLACE FUNCTION public.can_edit_card(p_user_id UUID, p_card_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM cards c
        JOIN board_members bm ON c.board_id = bm.board_id
        WHERE c.id = p_card_id 
        AND bm.user_id = p_user_id
        AND bm.role = ANY(ARRAY['owner'::text, 'admin'::text, 'editor'::text])
    );
END;
$$;

-- ============================================
-- 2. DROP EXISTING POLICIES WITH RECURSION
-- ============================================

-- Drop all existing organization_members policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;

-- Drop existing organizations policies that may have recursion
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;

-- Drop existing board policies with subqueries
DROP POLICY IF EXISTS "Users can view boards in their organizations" ON boards;
DROP POLICY IF EXISTS "Users can create boards in their organizations" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Users can update boards they have access to" ON boards;

-- Drop column policies with recursion
DROP POLICY IF EXISTS "Users can view columns on accessible boards" ON columns;
DROP POLICY IF EXISTS "Users can insert columns" ON columns;
DROP POLICY IF EXISTS "Users can update columns" ON columns;
DROP POLICY IF EXISTS "Users can delete columns" ON columns;
DROP POLICY IF EXISTS "Editors can modify columns" ON columns;

-- Drop card policies with recursion
DROP POLICY IF EXISTS "Users can view cards on accessible boards" ON cards;
DROP POLICY IF EXISTS "Users can create cards on accessible boards" ON cards;
DROP POLICY IF EXISTS "Users can update cards on accessible boards" ON cards;
DROP POLICY IF EXISTS "Users can view cards from accessible boards" ON cards;
DROP POLICY IF EXISTS "Editors can modify cards" ON cards;

-- Drop activities policies
DROP POLICY IF EXISTS "Users can view activities on accessible boards" ON activities;
DROP POLICY IF EXISTS "Users can view activities from accessible boards" ON activities;

-- Drop presence policies
DROP POLICY IF EXISTS "Users can view presence on accessible boards" ON presence;

-- Drop board_members policies with recursion
DROP POLICY IF EXISTS "Users can view board members" ON board_members;

-- Drop comments policies
DROP POLICY IF EXISTS "Users can view comments on accessible cards" ON comments;
DROP POLICY IF EXISTS "Users can add comments to accessible cards" ON comments;

-- ============================================
-- 3. CREATE FIXED POLICIES (NO RECURSION)
-- ============================================

-- Users table policies (simple, no recursion)
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Organizations policies using security definer functions
CREATE POLICY "Users can view their organizations"
ON organizations
FOR SELECT
USING (
    owner_id = auth.uid() 
    OR public.is_organization_member(auth.uid(), id)
);

CREATE POLICY "Users can create organizations"
ON organizations
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organization owners can update"
ON organizations
FOR UPDATE
USING (owner_id = auth.uid());

-- Organization members policies (FIXED - no self-reference)
CREATE POLICY "Users can view org members"
ON organization_members
FOR SELECT
USING (
    user_id = auth.uid()  -- User can see their own memberships
    OR public.is_organization_owner(auth.uid(), organization_id)  -- Or if they own the org
);

CREATE POLICY "Organization owners can manage members"
ON organization_members
FOR ALL
USING (public.is_organization_owner(auth.uid(), organization_id))
WITH CHECK (public.is_organization_owner(auth.uid(), organization_id));

-- Boards policies (FIXED - using security definer functions)
CREATE POLICY "Users can view boards"
ON boards
FOR SELECT
USING (
    created_by = auth.uid()  -- Creator can always view
    OR public.can_access_board(auth.uid(), id)  -- Or if board member
    OR public.is_organization_member(auth.uid(), organization_id)  -- Or org member
);

CREATE POLICY "Users can create boards"
ON boards
FOR INSERT
WITH CHECK (
    created_by = auth.uid()
    AND (
        organization_id IS NULL 
        OR public.is_organization_member(auth.uid(), organization_id)
    )
);

CREATE POLICY "Board owners and admins can update"
ON boards
FOR UPDATE
USING (
    created_by = auth.uid()
    OR public.has_board_role(auth.uid(), id, ARRAY['owner'::text, 'admin'::text])
);

-- Columns policies (FIXED)
CREATE POLICY "Users can view columns"
ON columns
FOR SELECT
USING (public.can_access_board(auth.uid(), board_id));

CREATE POLICY "Editors can modify columns"
ON columns
FOR ALL
USING (
    public.has_board_role(auth.uid(), board_id, ARRAY['owner'::text, 'admin'::text, 'editor'::text])
);

-- Cards policies (FIXED)
CREATE POLICY "Users can view cards"
ON cards
FOR SELECT
USING (public.can_access_board(auth.uid(), board_id));

CREATE POLICY "Editors can modify cards"
ON cards
FOR ALL
USING (
    public.has_board_role(auth.uid(), board_id, ARRAY['owner'::text, 'admin'::text, 'editor'::text])
);

-- Activities policies (FIXED)
CREATE POLICY "Users can view activities"
ON activities
FOR SELECT
USING (public.can_access_board(auth.uid(), board_id));

-- Presence policies (FIXED)
CREATE POLICY "Users can view presence"
ON presence
FOR SELECT
USING (public.can_access_board(auth.uid(), board_id));

CREATE POLICY "Users can update own presence"
ON presence
FOR ALL
USING (entity_id = auth.uid());

-- Board members policies (FIXED)
CREATE POLICY "Users can view board members"
ON board_members
FOR SELECT
USING (public.can_access_board(auth.uid(), board_id));

CREATE POLICY "Board owners can manage members"
ON board_members
FOR ALL
USING (public.has_board_role(auth.uid(), board_id, ARRAY['owner'::text, 'admin'::text]));

-- Comments policies (FIXED)
CREATE POLICY "Users can view comments"
ON comments
FOR SELECT
USING (public.can_view_card(auth.uid(), card_id));

CREATE POLICY "Users can add comments"
ON comments
FOR INSERT
WITH CHECK (public.can_access_board(auth.uid(), board_id));

-- Agents policies (simple)
CREATE POLICY "Users can manage their own agents"
ON agents
FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 4. GRANT PERMISSIONS ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_access_board(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_board(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_board_role(UUID, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_board_role(UUID, UUID, TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_view_card(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_card(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_edit_card(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_card(UUID, UUID) TO anon;

-- ============================================
-- 5. VERIFICATION INDEXES
-- ============================================

-- Add indexes to optimize policy lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_board ON board_members(user_id, board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_role ON board_members(user_id, board_id, role);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON boards(created_by);
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);

-- ============================================
-- VERIFICATION QUERIES (Run manually if needed)
-- ============================================

-- Check all policies
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Check for any remaining self-referencing policies
-- SELECT tablename, policyname, qual 
-- FROM pg_policies 
-- WHERE qual LIKE '%' || tablename || '%';
