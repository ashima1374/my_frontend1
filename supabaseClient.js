import { createClient } from "@supabase/supabase-js";

// ✅ Use your actual Supabase credentials (for now you can hardcode them safely in dev)
const supabaseUrl = "https://csqlvofmedwhmfmkyzlr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcWx2b2ZtZWR3aG1mbWt5emxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzQ4NTAsImV4cCI6MjA3NjA1MDg1MH0.EpLsCWc3HS1yuzw0qMNFgX88KtjnvtwNvF4OflEVTwY";

// ✅ Create Supabase client with session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
