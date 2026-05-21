import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const PUSH_TOKEN_KEY = "@learnflow_push_token";

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (cached) return cached;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function clearPushTokenCache(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}
