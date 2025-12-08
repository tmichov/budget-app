import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kadekolku.app',
  appName: 'Kade Kolku',
  webDir: 'public',
  server: {
    url: 'https://budget-app-kappa-black.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    scheme: 'kadekolku',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      signingType: 'jarsigner',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#f3f1ed',
      showSpinner: false,
    },
  },
};

export default config;
