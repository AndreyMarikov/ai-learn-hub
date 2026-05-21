import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl } from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { registerWidgetTaskHandler, requestWidgetUpdate } from "react-native-android-widget";
import { widgetTaskHandler } from "@/widgets/widgetTaskHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TopicsProvider } from "@/contexts/TopicsContext";
import "@/services/backgroundTask";
import { getWidgetData, setWidgetData } from "@/services/widgetData";
import { SnippetWidget } from "@/widgets/SnippetWidget";

if (Platform.OS === "android") {
  registerWidgetTaskHandler(widgetTaskHandler);
}

setBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080");

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  Notifications.addNotificationReceivedListener((notification) => {
    if (Platform.OS !== "android") return;
    const data = notification.request.content.data as {
      snippet?: string;
      topicId?: string;
    } | null;
    const snippet = data?.snippet;
    if (!snippet) return;

    getWidgetData()
      .then(async (current) => {
        if (!current) return;
        const updated = {
          ...current,
          snippets: [...current.snippets, snippet],
        };
        await setWidgetData(updated);
        await requestWidgetUpdate({
          widgetName: "SnippetWidget",
          renderWidget: async () => {
            const latest = await getWidgetData();
            return React.createElement(SnippetWidget, {
              topicTitle: latest?.topicTitle ?? current.topicTitle,
              topicEmoji: latest?.topicEmoji ?? current.topicEmoji,
              snippet:
                latest?.snippets?.[latest?.currentIndex ?? 0] ?? snippet,
              imageDataUrl: latest?.imageDataUrl ?? null,
            });
          },
          widgetNotFound: () => {},
        });
      })
      .catch(() => {});
  });
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const colors = useColors();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ backgroundColor: "transparent", flex: 1 }}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <TopicsProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </TopicsProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
