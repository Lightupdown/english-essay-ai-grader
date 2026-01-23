/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly ZHIPU_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
