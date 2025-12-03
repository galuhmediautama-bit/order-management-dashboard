
// This file is for global type declarations

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
