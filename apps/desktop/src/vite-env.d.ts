/// <reference types="vite/client" />

/// <reference types="vite/client" />

type AppSettings = {
  serverUrl: string;
  serverToken: string;
};

interface Window {
  apple2apple: {
    loadSettings: () => Promise<AppSettings>;
    saveSettings: (settings: AppSettings) => Promise<AppSettings>;
  };
}