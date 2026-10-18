CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.resolve_username_to_email(username_input text)
RETURNS TABLE(email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email::text
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(username_input)
  LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS public.couple_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.couple_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(couple_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  story text NOT NULL,
  image_path text NOT NULL,
  memory_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid UNIQUE NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  home_background_ids uuid[] NOT NULL DEFAULT '{}',
  active_home_background_id uuid,
  future_plan_image_id uuid,
  goals_image_id uuid,
  relationship_intro text,
  relationship_quotes jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.future_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  target_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  target_date date,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (is_completed = true AND completed_at IS NOT NULL)
    OR (is_completed = false AND completed_at IS NULL)
  )
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER memories_set_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER future_plans_set_updated_at
BEFORE UPDATE ON public.future_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER shared_goals_set_updated_at
BEFORE UPDATE ON public.shared_goals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_member_of_couple(p_couple_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.couple_members cm
    WHERE cm.couple_id = p_couple_id
      AND cm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_memory_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'site_settings' THEN
    IF NEW.home_background_ids IS NOT NULL AND cardinality(NEW.home_background_ids) > 5 THEN
      RAISE EXCEPTION 'home_background_ids can contain at most five valid memory IDs';
    END IF;

    IF NEW.active_home_background_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = NEW.active_home_background_id AND m.couple_id = NEW.couple_id
    ) THEN
      RAISE EXCEPTION 'active_home_background_id must point to a memory in the same couple';
    END IF;

    IF NEW.future_plan_image_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = NEW.future_plan_image_id AND m.couple_id = NEW.couple_id
    ) THEN
      RAISE EXCEPTION 'future_plan_image_id must point to a memory in the same couple';
    END IF;

    IF NEW.goals_image_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = NEW.goals_image_id AND m.couple_id = NEW.couple_id
    ) THEN
      RAISE EXCEPTION 'goals_image_id must point to a memory in the same couple';
    END IF;

    IF NEW.home_background_ids IS NOT NULL THEN
      IF EXISTS (
        SELECT 1
        FROM unnest(NEW.home_background_ids) AS id
        LEFT JOIN public.memories m ON m.id = id
        WHERE m.id IS NULL OR m.couple_id <> NEW.couple_id
      ) THEN
        RAISE EXCEPTION 'home_background_ids contains invalid or unauthorized memory IDs';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER site_settings_reference_validation
BEFORE INSERT OR UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.validate_memory_reference();

CREATE POLICY "Profiles are viewable by authenticated members of their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Profiles can be updated by the owning user"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Members can read their couple space"
ON public.couple_spaces
FOR SELECT
USING (public.is_member_of_couple(id));

CREATE POLICY "Authenticated users can create a couple space"
ON public.couple_spaces
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can read couple memberships"
ON public.couple_members
FOR SELECT
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Authenticated users can join a couple space through trusted invitation logic"
ON public.couple_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.is_member_of_couple(couple_id)
);

CREATE POLICY "Members can read memories for their couple"
ON public.memories
FOR SELECT
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can insert memories for their couple"
ON public.memories
FOR INSERT
WITH CHECK (
  public.is_member_of_couple(couple_id)
  AND (created_by IS NULL OR created_by = auth.uid())
);

CREATE POLICY "Members can update their couple memories"
ON public.memories
FOR UPDATE
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can delete their couple memories"
ON public.memories
FOR DELETE
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can read site settings for their couple"
ON public.site_settings
FOR SELECT
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can create site settings for their couple"
ON public.site_settings
FOR INSERT
WITH CHECK (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can update site settings for their couple"
ON public.site_settings
FOR UPDATE
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can read future plans for their couple"
ON public.future_plans
FOR SELECT
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can insert future plans for their couple"
ON public.future_plans
FOR INSERT
WITH CHECK (
  public.is_member_of_couple(couple_id)
  AND (created_by IS NULL OR created_by = auth.uid())
);

CREATE POLICY "Members can update future plans for their couple"
ON public.future_plans
FOR UPDATE
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can delete future plans for their couple"
ON public.future_plans
FOR DELETE
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can read goals for their couple"
ON public.shared_goals
FOR SELECT
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can insert goals for their couple"
ON public.shared_goals
FOR INSERT
WITH CHECK (
  public.is_member_of_couple(couple_id)
  AND (created_by IS NULL OR created_by = auth.uid())
);

CREATE POLICY "Members can update goals for their couple"
ON public.shared_goals
FOR UPDATE
USING (public.is_member_of_couple(couple_id));

CREATE POLICY "Members can delete goals for their couple"
ON public.shared_goals
FOR DELETE
USING (public.is_member_of_couple(couple_id));

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'memory-photos',
  'memory-photos',
  false,
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.user_can_access_memory_photo(bucket_name text, object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memories m
    JOIN public.couple_members cm ON cm.couple_id = m.couple_id
    WHERE cm.user_id = auth.uid()
      AND m.image_path = object_name
      AND bucket_name = 'memory-photos'
  );
$$;

CREATE POLICY "Members can read memory photos for their couple"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'memory-photos'
  AND public.user_can_access_memory_photo(bucket_id, name)
);

CREATE POLICY "Members can upload memory photos for their couple"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'memory-photos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.couple_members cm
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update their couple memory photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'memory-photos'
  AND public.user_can_access_memory_photo(bucket_id, name)
);

CREATE POLICY "Members can delete their couple memory photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'memory-photos'
  AND public.user_can_access_memory_photo(bucket_id, name)
);
