
CREATE POLICY studio_files_read_dev ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'studio-files' AND public.is_project_developer(((storage.foldername(name))[1])::uuid));

CREATE POLICY studio_files_write_dev ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-files' AND public.is_project_developer(((storage.foldername(name))[1])::uuid));
