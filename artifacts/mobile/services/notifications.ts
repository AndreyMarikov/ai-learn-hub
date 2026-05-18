import * as Notifications from "expo-notifications";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "@learnflow_notifications_v2";

function frequencyToSeconds(frequency: string): number {
  const f = frequency.toLowerCase();
  if (f.includes("several")) return 4 * 3600;
  if (f.includes("once") || f.includes("daily")) return 24 * 3600;
  return 3 * 24 * 3600;
}

async function saveImageToTemp(
  base64Data: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const filename = `learnflow_notif_${Date.now()}.${ext}`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  } catch {
    return null;
  }
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
  topicEmoji?: string,
  snippetImages?: Array<{ base64: string; mimeType: string } | null>,
): Promise<string[]> {
  if (Platform.OS === "web") return [];

  await cancelTopicNotifications(topicId);

  const intervalSeconds = frequencyToSeconds(frequency);
  const notificationIds: string[] = [];
  const emoji = topicEmoji ?? "📚";
  const notifTitle = `${emoji} ${topicTitle}`;

  for (let i = 0; i < snippets.length; i++) {
    const seconds = i === 0 ? 5 : i * intervalSeconds;
    const imageEntry = snippetImages?.[i] ?? null;

    let localImageUri: string | null = null;
    if (imageEntry) {
      localImageUri = await saveImageToTemp(imageEntry.base64, imageEntry.mimeType);
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: notifTitle,
        body: snippets[i],
        sound: true,
        data: { topicId },
      };

      if (localImageUri && Platform.OS === "ios") {
        (content as Record<string, unknown>).attachments = [
          { url: localImageUri },
        ];
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        },
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

export async function appendSnippetNotifications(
  topicId: string,
  topicTitle: string,
  snippets: string[],
  frequency: string,
  topicEmoji?: string,
  snippetImages?: Array<{ base64: string; mimeType: string } | null>,
): Promise<string[]> {
  if (Platform.OS === "web") return [];

  const intervalSeconds = frequencyToSeconds(frequency);
  const emoji = topicEmoji ?? "📚";
  const notifTitle = `${emoji} ${topicTitle}`;
  const newIds: string[] = [];

  const stored = await getStoredMap();
  const entry = stored[topicId];
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingCount = entry
    ? allScheduled.filter((n) => entry.ids.includes(n.identifier)).length
    : 0;

  for (let i = 0; i < snippets.length; i++) {
    const seconds = (existingCount + i + 1) * intervalSeconds;
    const imageEntry = snippetImages?.[i] ?? null;

    let localImageUri: string | null = null;
    if (imageEntry) {
      localImageUri = await saveImageToTemp(imageEntry.base64, imageEntry.mimeType);
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: notifTitle,
        body: snippets[i],
        sound: true,
        data: { topicId },
      };

      if (localImageUri && Platform.OS === "ios") {
        (content as Record<string, unknown>).attachments = [
          { url: localImageUri },
        ];
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        },
      });
      newIds.push(id);
    } catch {
    }
  }

  if (entry) {
    entry.ids.push(...newIds);
    entry.count += snippets.length;
    stored[topicId] = entry;
  } else {
    stored[topicId] = { ids: newIds, count: snippets.length };
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return newIds;
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
