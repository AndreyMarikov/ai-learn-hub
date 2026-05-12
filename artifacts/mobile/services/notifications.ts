import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "@learnflow_notifications_v2";

function frequencyToSeconds(frequency: string): number {
  const f = frequency.toLowerCase();
  if (f.includes("several")) return 4 * 3600;
  if (f.includes("once") || f.includes("daily")) return 24 * 3600;
  return 3 * 24 * 3600;
}

async function saveTopicImageLocally(
  topicId: string,
  imageBase64: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
    const fileUri = `${FileSystem.cacheDirectory}learnflow-topic-${topicId}.${ext}`;
    await FileSystem.writeAsStringAsync(fileUri, imageBase64, {
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
  imageBase64?: string,
  imageMimeType?: string,
): Promise<string[]> {
  if (Platform.OS === "web") return [];

  await cancelTopicNotifications(topicId);

  const intervalSeconds = frequencyToSeconds(frequency);
  const notificationIds: string[] = [];
  const emoji = topicEmoji ?? "📚";
  const notifTitle = `${emoji} ${topicTitle}`;

  let imageLocalUri: string | null = null;
  if (imageBase64 && Platform.OS === "ios") {
    imageLocalUri = await saveTopicImageLocally(topicId, imageBase64, imageMimeType ?? "image/png");
  }

  for (let i = 0; i < snippets.length; i++) {
    const seconds = i === 0 ? 5 : i * intervalSeconds;
    try {
      const attachments =
        imageLocalUri && Platform.OS === "ios"
          ? [{ identifier: `learnflow-img-${topicId}`, url: imageLocalUri }]
          : undefined;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notifTitle,
          body: snippets[i],
          sound: true,
          data: { topicId },
          ...(attachments ? { attachments } : {}),
        },
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
  try {
    const ext = ["jpg", "png"].find(async (e) => {
      const uri = `${FileSystem.cacheDirectory}learnflow-topic-${topicId}.${e}`;
      const info = await FileSystem.getInfoAsync(uri);
      return info.exists;
    });
    if (ext) {
      await FileSystem.deleteAsync(
        `${FileSystem.cacheDirectory}learnflow-topic-${topicId}.${ext}`,
        { idempotent: true },
      );
    }
  } catch {
  }
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
