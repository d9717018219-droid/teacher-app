import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doableindia',
  appName: 'DoAble India',
  webDir: 'dist',
  server: {
    hostname: 'localhost'
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "237759117673-t8sj47mgt7c982rdvjhmqlp5n676o0u8.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    CapacitorHttp: {
      enabled: false,
    },
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
