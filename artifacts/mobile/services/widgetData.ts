import AsyncStorage from "@react-native-async-storage/async-storage";

const WIDGET_DATA_KEY = "@learnflow_widget_data";

export interface WidgetData {
  topicId: string;
  topicTitle: string;
  topicEmoji: string;
  snippets: string[];
  currentIndex: number;
  imageDataUrl: string | null;
}

export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return raw ? (JSON.parse(raw) as WidgetData) : null;
  } catch {
    return null;
  }
}

export async function setWidgetData(data: WidgetData): Promise<void> {
  await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
}

export async function advanceWidgetSnippet(): Promise<WidgetData | null> {
  const data = await getWidgetData();
  if (!data || data.snippets.length === 0) return null;
  const updated: WidgetData = {
    ...data,
    currentIndex: (data.currentIndex + 1) % data.snippets.length,
  };
  await setWidgetData(updated);
  return updated;
}

export async function clearWidgetData(): Promise<void> {
  await AsyncStorage.removeItem(WIDGET_DATA_KEY);
}
