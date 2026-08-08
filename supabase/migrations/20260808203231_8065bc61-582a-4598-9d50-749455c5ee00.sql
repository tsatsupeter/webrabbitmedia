REVOKE ALL ON FUNCTION public.sms_ensure_wallet(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sms_wallet_entry(uuid, text, text, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sms_ensure_wallet(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sms_wallet_entry(uuid, text, text, numeric, text, text, text) TO authenticated, service_role;