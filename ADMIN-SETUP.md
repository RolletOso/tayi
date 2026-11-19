# Tayi admin setup

The admin dashboard is available at `/admin`. It uses Supabase Auth and row-level security. Never put a service-role key in browser code.

1. Apply `supabase/admin.sql` in the Supabase SQL Editor.
2. In Supabase Dashboard → Authentication → Users, create your administrator account with a strong password.
3. Copy that user's UUID and run:
   `insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');`
4. Confirm Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then redeploy.
5. Visit `/admin` and sign in.

The initial dashboard supports overview counts, adding places, stops, route legs and fares, and reviewing community reports. Route and fare references currently use database UUIDs. Inline editing and linked selectors are planned next.