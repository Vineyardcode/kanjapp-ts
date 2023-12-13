/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_X_RapidAPI_Key: string
  readonly VITE_X_RapidAPI_Host: string
  readonly VITE_GEO_API_URL: string
  readonly VITE_WEATHER_API_URL: string
  readonly VITE_WEATHER_API_KEY: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_DATABASE_URL: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
