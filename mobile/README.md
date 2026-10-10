# KnockOUT Mobile

One Expo SDK 57 application for Admin, Waiter, and Chef on iOS and Android.

All roles connect to the same backend using a Hotel ID and PIN. Configure `EXPO_PUBLIC_API_PORT` to 5000 for PM2 or the published Docker backend port (default 5100).

Set `EXPO_PUBLIC_API_HOST` in `.env` to the computer's LAN IP. Keep the phone and computer on the same network.

```bash
npm install
npm run start:clear
```

Build locally:

```bash
npm run android
npm run ios
```

EAS builds:

```bash
eas build --platform all --profile production
```
