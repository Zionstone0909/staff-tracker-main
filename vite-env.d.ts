// vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Define the types for the environment variables accessed in lib/supabase.ts
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}