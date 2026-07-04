import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

function guessDevApiUrl(): string {
  // Android emulator can't reach the host machine via localhost — it needs the special alias.
  // This only applies to the emulator, NOT a real phone — a real device needs the dev
  // machine's actual LAN IP instead (see below), or an explicit EXPO_PUBLIC_API_URL.
  if (Platform.OS === "android" && !Device.isDevice) return "http://10.0.2.2:8000";

  // On a physical device, try to infer the dev machine's LAN IP from the Expo dev server host
  // (the URL Metro was loaded from), since "localhost" on-device means the phone itself.
  // Note: this only works in LAN mode — in `--tunnel` mode the host is an ngrok address that
  // doesn't lead back to the backend, so set EXPO_PUBLIC_API_URL explicitly in that case.
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".exp.direct") && !host.includes("ngrok")) {
    return `http://${host}:8000`;
  }

  return "http://localhost:8000";
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? guessDevApiUrl();

export const DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const DEMO_ATHLETE_NAME = "Rahul Sharma";
