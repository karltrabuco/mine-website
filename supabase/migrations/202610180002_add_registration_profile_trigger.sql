CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_case_insensitive_idx
ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.normalize_username(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(COALESCE(regexp_replace(value, '[^a-zA-Z0-9_]+', '', 'g'), '')));
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_username text;
  display_name_value text;
BEGIN
  normalized_username := public.normalize_username(COALESCE(NEW.raw_user_meta_data->>'username', ''));
  display_name_value := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'display_name', '')), '');

  IF normalized_username = '' THEN
    RAISE EXCEPTION 'Username is required.';
  END IF;

  IF normalized_username !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Username can only contain letters, numbers, and underscores.';
  END IF;

  IF length(normalized_username) < 3 OR length(normalized_username) > 24 THEN
    RAISE EXCEPTION 'Username must be between 3 and 24 characters.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(username) = normalized_username
  ) THEN
    RAISE EXCEPTION 'This username is already taken.';
  END IF;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, normalized_username, display_name_value);

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'This username is already taken.';
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
WHEN (NEW.raw_user_meta_data ? 'username')
EXECUTE FUNCTION public.handle_new_auth_user();
