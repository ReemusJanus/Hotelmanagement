# KnockOUT Mobile

One Expo SDK 54 application for Admin, Waiter, and Chef on iOS and Android.

The first screen selects a portal. Each role then verifies its 4-digit OTP/PIN against its own backend:

| Portal | Demo OTP | API |
|---|---:|---:|
| Admin | `1234` | `6000` |
| Waiter | `1111` | `7100/api` proxy |
| Chef | `2222` | `8000` |

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
