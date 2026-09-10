/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_X_RapidAPI_Key: string
  readonly VITE_X_RapidAPI_Host: string
  readonly VITE_GEO_API_URL: string
  readonly VITE_WEATHER_API_URL: string
  readonly VITE_WEATHER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
