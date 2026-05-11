import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "@learnflow_notifications_v2";

function frequencyToSeconds(frequency: string): number {
  if (frequency.includes("several")) return 4 * 3600;
  if (frequency.includes("once")) return 24 * 3600;
  return 48 * 3600;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleSnippetNotifications(
  topicId: string,
  topicTitle: string,
  snippets: string[],
  frequency: string,
): Promise<string[]> {
  if (Platform.OS === "web") return [];

  await cancelTopicNotifications(topicId);

  const intervalSeconds = frequencyToSeconds(frequency);
  const notificationIds: string[] = [];

  for (let i = 0; i < snippets.length; i++) {
    const seconds = (i + 1) * intervalSeconds;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: topicTitle,
          body: snippets[i],
          sound: true,
          data: { topicId },
        },
        trigger: { seconds, repeats: false },
      });
      notificationIds.push(id);
    } catch {
    }
  }

  const stored = await getStoredMap();
  stored[topicId] = { ids: notificationIds, count: snippets.length };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return notificationIds;
}

export async function cancelTopicNotifications(topicId: string): Promise<void> {
  if (Platform.OS === "web") return;
  const stored = await getStoredMap();
  const entry = stored[topicId];
  if (!entry) return;
  await Promise.all(
    entry.ids.map((id: string) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
  delete stored[topicId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export async function getTopicNotificationInfo(
  topicId: string,
): Promise<{ count: number; scheduledCount: number } | null> {
  if (Platform.OS === "web") return null;
  const stored = await getStoredMap();
  const entry = stored[topicId];
  if (!entry) return null;

  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const active = allScheduled.filter((n) => entry.ids.includes(n.identifier));
  return { count: entry.count, scheduledCount: active.length };
}

async function getStoredMap(): Promise<
  Record<string, { ids: string[]; count: number }>
> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}
