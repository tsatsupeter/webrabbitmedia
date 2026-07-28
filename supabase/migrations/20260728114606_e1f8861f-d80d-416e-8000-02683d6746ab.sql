REVOKE EXECUTE ON FUNCTION public.notify_business_approved() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_payout() FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;