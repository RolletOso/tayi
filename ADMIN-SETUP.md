# Tayi admin setup

The admin interface is at `/admin`. The admin database permissions migration has already been applied to the connected Supabase project.

1. In Supabase Dashboard → Authentication → Users, create your administrator account with a strong password.
2. Copy the user's UUID and run in the SQL Editor:
   `insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');`
3. Confirm Vercel contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Merge the admin pull request after CI succeeds, then allow Vercel to deploy.
5. Open `/admin` and sign in.

The dashboard supports add/edit/delete for places, stops, route legs and fares; place-to-stop matching; and approval/rejection of community reports. Admin operations are guarded by Supabase Auth and row-level security. Never put a service-role key in browser code.
