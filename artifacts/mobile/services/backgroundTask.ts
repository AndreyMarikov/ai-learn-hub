import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import {
  getWidgetData,
  setWidgetData,
  advanceWidgetSnippet,
} from "@/services/widgetData";
import { SnippetWidget } from "@/widgets/SnippetWidget";
import { isInQuietHours } from "@/services/quietHours";

export const WIDGET_ROTATION_TASK = "LEARNFLOW_WIDGET_ROTATION";

const LOW_SNIPPET_THRESHOLD = 10;

TaskManager.defineTask(WIDGET_ROTATION_TASK, async () => {
  try {
    const peek = await getWidgetData();
    if (peek?.profile?.quietHours && isInQuietHours(peek.profile.quietHours)) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const data = await advanceWidgetSnippet();
    if (!data) return BackgroundFetch.BackgroundFetchResult.NoData;

    const remaining = data.snippets.length - data.currentIndex;
    if (remaining < LOW_SNIPPET_THRESHOLD && data.profile && data.baseUrl) {
      fetchAndAppendSnippets(data).catch(() => {});
    }

    await requestWidgetUpdate({
      widgetName: "SnippetWidget",
      renderWidget: async () => {
        const latest = await getWidgetData();
        return React.createElement(SnippetWidget, {
          topicTitle: latest?.topicTitle ?? data.topicTitle,
          topicEmoji: latest?.topicEmoji ?? data.topicEmoji,
          snippet:
            latest?.snippets?.[latest?.currentIndex ?? 0] ??
            data.snippets[data.currentIndex] ??
            "",
          imageDataUrl: latest?.imageDataUrl ?? data.imageDataUrl,
        });
      },
      widgetNotFound: () => {},
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function fetchAndAppendSnippets(data: Awaited<ReturnType<typeof getWidgetData>> & object): Promise<void> {
  const res = await fetch(`${data.baseUrl}/api/gemini/snippets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile: data.profile }),
  });
  if (!res.ok) return;

  const { snippets: newSnippets, topicEmoji } = (await res.json()) as {
    snippets: string[];
    topicEmoji: string;
  };
  if (!newSnippets?.length) return;

  const imageRes = await fetch(`${data.baseUrl}/api/gemini/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: data.userId,
      topic: data.profile.topic,
      snippetText: newSnippets[0],
    }),
  }).catch(() => null);

  let newImageDataUrl: string | null = data.imageDataUrl;
  if (imageRes?.ok) {
    const imgData = (await imageRes.json()) as {
      imageData: string | null;
      mimeType: string | null;
      limitReached: boolean;
    };
    if (imgData.imageData && imgData.mimeType) {
      newImageDataUrl = `data:${imgData.mimeType};base64,${imgData.imageData}`;
    }
  }

  const current = await getWidgetData();
  if (!current) return;

  await setWidgetData({
    ...current,
    topicEmoji: topicEmoji ?? current.topicEmoji,
    snippets: [...current.snippets, ...newSnippets],
    imageDataUrl: newImageDataUrl,
  });
}

export async function registerWidgetRotationTask(intervalSeconds = 1800): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_ROTATION_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(WIDGET_ROTATION_TASK, {
        minimumInterval: intervalSeconds,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
  }
}

export async function unregisterWidgetRotationTask(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_ROTATION_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(WIDGET_ROTATION_TASK);
    }
  } catch {
  }
}
