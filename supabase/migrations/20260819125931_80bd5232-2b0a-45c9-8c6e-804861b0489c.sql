
REVOKE EXECUTE ON FUNCTION public.notify_developer_application() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_project_assignment() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_developer_earning() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_developer() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_project_developer(uuid) FROM anon;
