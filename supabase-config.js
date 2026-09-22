/* Be Empowered Network — Supabase connection
   ------------------------------------------------------------------
   The anon key is a PUBLIC key. It is designed to ship in browser code
   and is safe here: every table is locked down by Row Level Security
   (see supabase-schema.sql), so this key can only do what the policies
   allow. Never put the `service_role` key in this file — that one
   bypasses RLS entirely and must stay server-side. */
window.SUPABASE_CONFIG = {
  url: 'https://wsytzmqxktvzxpwcfjyw.supabase.co',

  /* anon / public key — role "anon", safe to ship in the browser. */
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeXR6bXF4a3R2enhwd2Nmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE4NzMsImV4cCI6MjEwNTY1Nzg3M30.u-qmM9JR5Ol7usMY6SvqAozb5gtRK0NhJZKLFOes8AA',

  /* Where Supabase sends people back to after Google / Apple / email
     confirmation. Must also be listed in
     Supabase → Authentication → URL Configuration → Redirect URLs. */
  redirectTo: location.origin + '/account.html'
};
