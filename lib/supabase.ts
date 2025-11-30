import { createClient } from "@supabase/supabase-js";

// 1. Access environment variables. TypeScript now recognizes 'env' 
// due to the vite-env.d.ts file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Strict check to ensure variables are present at runtime.
if (!supabaseUrl || !supabaseAnonKey) {
  // This error will crash the application early if the .env file is missing
  // or if the variables haven't been set in the deployment environment (e.g., Netlify).
  throw new Error(
    "Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY) are missing. Please check your .env file and deployment settings."
  );
}

// 3. Create Supabase client.
// Because of the strict check above, TypeScript knows both variables are non-null strings here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);