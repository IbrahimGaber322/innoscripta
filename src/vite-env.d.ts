/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEWSAPI_API_KEY?: string
  readonly VITE_GUARDIAN_API_KEY?: string
  readonly VITE_NYT_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
