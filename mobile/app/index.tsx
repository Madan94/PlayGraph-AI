import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session } = useAuth();

  if (!session) return <Redirect href="/login" />;

  if (session.role === "athlete") return <Redirect href="/(tabs)/profile" />;

  return <Redirect href="/(tabs)/chat" />;
}
