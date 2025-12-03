
// This file is for global type declarations

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly GEMINI_API_KEY: string
  readonly PROD: boolean
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  fbq: (...args: any[]) => void;
  _fbq: any;
  
  gtag: (...args: any[]) => void;
  dataLayer: any[];
  
  ttq: {
    load: (id: string) => void;
    page: () => void;
    track: (event: string, params?: any) => void;
    instance: (id: string) => any;
  };
  
  // Snack Video Pixel
  snack: {
    pixel: {
        track: (event: string) => void;
    }
  }
}
