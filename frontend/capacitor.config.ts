import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartresume.verifier',
  appName: 'Smart Resume Verifier',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
