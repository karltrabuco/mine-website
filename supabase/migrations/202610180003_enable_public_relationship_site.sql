BEGIN;

INSERT INTO public.couple_spaces (id, name)
VALUES ('00000000-0000-4000-8000-000000000001', 'Our Love Story')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  existing_couple_count integer;
  existing_couple_id uuid;
  public_couple_id constant uuid := '00000000-0000-4000-8000-000000000001';
BEGIN
  SELECT count(*)
  INTO existing_couple_count
  FROM public.couple_spaces
  WHERE id <> public_couple_id;

  IF existing_couple_count = 1 THEN
    SELECT id
    INTO existing_couple_id
    FROM public.couple_spaces
    WHERE id <> public_couple_id;

    IF NOT EXISTS (SELECT 1 FROM public.memories WHERE couple_id = public_couple_id)
      AND NOT EXISTS (SELECT 1 FROM public.site_settings WHERE couple_id = public_couple_id)
      AND NOT EXISTS (SELECT 1 FROM public.future_plans WHERE couple_id = public_couple_id)
      AND NOT EXISTS (SELECT 1 FROM public.shared_goals WHERE couple_id = public_couple_id) THEN
      UPDATE public.memories SET couple_id = public_couple_id WHERE couple_id = existing_couple_id;
      UPDATE public.future_plans SET couple_id = public_couple_id WHERE couple_id = existing_couple_id;
      UPDATE public.shared_goals SET couple_id = public_couple_id WHERE couple_id = existing_couple_id;
      UPDATE public.site_settings SET couple_id = public_couple_id WHERE couple_id = existing_couple_id;
    END IF;
  END IF;
END;
$$;

ALTER TABLE public.memories
  ALTER COLUMN couple_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE public.site_settings
  ALTER COLUMN couple_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE public.future_plans
  ALTER COLUMN couple_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE public.shared_goals
  ALTER COLUMN couple_id SET DEFAULT '00000000-0000-4000-8000-000000000001';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.memories, public.site_settings, public.future_plans, public.shared_goals
  TO anon, authenticated;

CREATE POLICY "Public visitors can read site memories"
ON public.memories
FOR SELECT
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can add site memories"
ON public.memories
FOR INSERT
TO anon, authenticated
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can edit site memories"
ON public.memories
FOR UPDATE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001')
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can delete site memories"
ON public.memories
FOR DELETE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can read site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can create site settings"
ON public.site_settings
FOR INSERT
TO anon, authenticated
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can edit site settings"
ON public.site_settings
FOR UPDATE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001')
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can read site future plans"
ON public.future_plans
FOR SELECT
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can add site future plans"
ON public.future_plans
FOR INSERT
TO anon, authenticated
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can edit site future plans"
ON public.future_plans
FOR UPDATE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001')
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can delete site future plans"
ON public.future_plans
FOR DELETE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can read site shared goals"
ON public.shared_goals
FOR SELECT
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can add site shared goals"
ON public.shared_goals
FOR INSERT
TO anon, authenticated
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can edit site shared goals"
ON public.shared_goals
FOR UPDATE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001')
WITH CHECK (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can delete site shared goals"
ON public.shared_goals
FOR DELETE
TO anon, authenticated
USING (couple_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Public visitors can read site memory photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'memory-photos'
  AND EXISTS (
    SELECT 1
    FROM public.memories m
    WHERE m.couple_id = '00000000-0000-4000-8000-000000000001'
      AND m.image_path = storage.objects.name
  )
);

CREATE POLICY "Public visitors can upload site memory photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'memory-photos'
  AND (storage.foldername(name))[1] = 'memories'
);

COMMIT;
