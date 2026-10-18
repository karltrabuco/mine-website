# Our Love Story

A romantic relationship website built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Local development

1. Install dependencies:
   npm install
2. Copy the environment template:
   cp .env.example .env.local
3. Add your Supabase values:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Run the app:
   npm run dev -- --host 0.0.0.0

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/migrations/202610180001_create_relationship_app_schema.sql` and `supabase/migrations/202610180003_enable_public_relationship_site.sql` in order. The first migration creates the tables and private `memory-photos` bucket; the third creates the public site's relationship space, assigns existing data only when there is exactly one prior relationship space, and grants scoped anonymous access.
3. If the project has more than one existing relationship space, the public migration deliberately leaves those records private. Move only the intended site's memories, settings, plans, and goals to relationship ID `00000000-0000-4000-8000-000000000001` before publishing.

The public site allows any visitor to read, add, edit, and delete the relationship's memories, plans, and goals, and to read or edit its site settings. Visitors can also upload memory photos. RLS remains enabled and all access is scoped to that one relationship space; profiles, memberships, and other relationship spaces are not made public. However, because public writes are enabled, anyone can change or delete this site's content. Do not store private or sensitive information here. The storage bucket remains private; the app issues short-lived signed URLs only for photos referenced by public memories.

## Important notes

- The frontend should never include a service role key.
- The frontend uses only the Supabase publishable/anon key; never include a service-role key.
- Authentication is not required by the frontend. Supabase RLS limits anonymous access to the dedicated public relationship space.
- If Supabase credentials are not configured, the app gracefully falls back to a demo mode so the UI can still be previewed.
