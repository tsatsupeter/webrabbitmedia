REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, authenticated;

-- Confirm that the new trigger function is also not exposed to public callers
REVOKE EXECUTE ON FUNCTION public.update_notifications_updated_at() FROM PUBLIC, authenticated;