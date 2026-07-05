# NextPlayAI Mobile

React Native app (Expo + expo-router) for NextPlayAI. Talks to the existing FastAPI backend over HTTP only — no Kafka in this layer.

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL if needed
npx expo start
```

Backend must be running (`docker/docker-compose.yml` or `uvicorn backend.app.main:app`) and reachable from your device/emulator:

- Android emulator → `http://10.0.2.2:8000` (used automatically if `EXPO_PUBLIC_API_URL` is unset)
- Physical device → `http://<your-computer-LAN-IP>:8000`
- iOS Simulator → `http://localhost:8000` works as-is

## Demo login

Seeded users (password `demo` for both):

- `coach@nextplay.ai` — Coach, lands on Coach AI Chat
- `rahul@nextplay.ai` — Athlete, lands on Athlete Profile

If the memory timeline is empty, use "Seed Demo Memories" on the Profile screen (calls `POST /api/v1/memory/seed-demo`) — mirrors the web app's demo seed.

## Structure

- `app/` — expo-router routes (`login`, `(tabs)/profile|chat|upload|demo`)
- `src/api/` — typed HTTP client mirroring the backend's `/api/v1/*` contracts
- `src/context/` — `AuthProvider` (SecureStore-backed session) and `ToastProvider`
- `src/components/` — shared UI (GlassCard, GradientButton, chat bubbles, timeline, skeletons)
- `src/theme/` — light/dark tokens matching the web app's purple/cyan/emerald branding

## Scripts

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web`
- `npm run typecheck` — `tsc --noEmit`
