import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported",
  "[expo-notifications]",
  "Must be on a physical device",
  "Failed to get push token"
]);

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(child)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
