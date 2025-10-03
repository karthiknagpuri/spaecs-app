-- =====================================================
-- Add phone field to collaboration_requests table
-- =====================================================

ALTER TABLE public.collaboration_requests
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN public.collaboration_requests.phone IS 'Optional phone number for contact';
