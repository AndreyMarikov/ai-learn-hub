import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useTopics, type LearningProfile } from "@/contexts/TopicsContext";
import {
  requestNotificationPermissions,
  cancelTopicNotifications,
} from "@/services/notifications";
import { getDeviceId } from "@/services/deviceId";
import { getExpoPushToken } from "@/services/pushToken";
import {
  setWidgetData,
  clearWidgetData,
  getWidgetData,
} from "@/services/widgetData";
import {
  registerWidgetRotationTask,
  unregisterWidgetRotationTask,
} from "@/services/backgroundTask";
import { requestWidgetUpdate } from "react-native-android-widget";
import { SnippetWidget } from "@/widgets/SnippetWidget";

interface LearningReadyCardProps {
  profile: LearningProfile;
  topicId: string;
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.profileRow}>
      <Feather name={icon as any} size={13} color={colors.mutedForeground} />
      <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.profileValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

type LoadingStage = "idle" | "snippets" | "scheduling" | "widget";

export function LearningReadyCard({
  profile,
  topicId,
}: LearningReadyCardProps) {
  const colors = useColors();
  const { topics, setWidgetActive } = useTopics();
  const topic = topics.find((t) => t.id === topicId);
  const isActive = topic?.widgetActive ?? false;

  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");

  const isLoading = loadingStage !== "idle";

  const loadingLabel = {
    idle: "Add widget & notifications",
    snippets: "Preparing your first snippet...",
    scheduling: "Setting up delivery...",
    widget: "Setting up widget...",
  }[loadingStage];

  const handleAddWidget = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not available on web",
        "Notifications require the mobile app via Expo Go.",
      );
      return;
    }
    setLoadingStage("snippets");
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Notifications required",
          "Please enable notifications in Settings to receive learning snippets.",
        );
        return;
      }

      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const baseUrl = domain ? `https://${domain}` : "";
      const deviceId = await getDeviceId();
      const pushToken = await getExpoPushToken();

      const snippetsRes = await fetch(`${baseUrl}/api/gemini/snippets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, count: 1 }),
      });
      if (!snippetsRes.ok) throw new Error("Failed to generate snippet");
      const { snippets: initialSnippets, topicEmoji } =
        (await snippetsRes.json()) as {
          snippets: string[];
          topicEmoji: string;
        };
      const firstSnippet = initialSnippets[0] ?? "";

      const imageRes = await fetch(`${baseUrl}/api/gemini/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: deviceId,
          topic: profile.topic,
          snippetText: firstSnippet,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (
            data: {
              imageData: string | null;
              mimeType: string | null;
              limitReached: boolean;
            } | null,
          ) =>
            data?.imageData && data?.mimeType
              ? { base64: data.imageData, mimeType: data.mimeType }
              : null,
        )
        .catch(() => null);

      setLoadingStage("scheduling");

      if (pushToken) {
        await fetch(`${baseUrl}/api/notifications/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: deviceId,
            pushToken,
            topicId,
            topicTitle: profile.topic,
            topicEmoji,
            profile,
            quietHours: profile.quietHours,
          }),
        });
      }

      setLoadingStage("widget");

      if (Platform.OS === "android") {
        const imageDataUrl = imageRes
          ? `data:${imageRes.mimeType};base64,${imageRes.base64}`
          : null;

        await setWidgetData({
          topicId,
          topicTitle: profile.topic,
          topicEmoji,
          snippets: firstSnippet ? [firstSnippet] : [],
          currentIndex: 0,
          imageDataUrl,
          profile,
          baseUrl,
          userId: deviceId,
        });

        await requestWidgetUpdate({
          widgetName: "SnippetWidget",
          renderWidget: async () => {
            const data = await getWidgetData();
            return React.createElement(SnippetWidget, {
              topicTitle: data?.topicTitle ?? profile.topic,
              topicEmoji: data?.topicEmoji ?? topicEmoji,
              snippet: data?.snippets?.[0] ?? firstSnippet,
              imageDataUrl: data?.imageDataUrl ?? null,
            });
          },
          widgetNotFound: () => {},
        });

        await registerWidgetRotationTask();
      }

      setWidgetActive(topicId, true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Error",
        "Failed to set up learning snippets. Please try again.",
      );
    } finally {
      setLoadingStage("idle");
    }
  };

  const handleRemoveWidget = async () => {
    Alert.alert(
      "Remove notifications & widget",
      "Stop receiving learning snippets for this topic?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
            const baseUrl = domain ? `https://${domain}` : "";
            const deviceId = await getDeviceId();

            await cancelTopicNotifications(topicId);

            await fetch(`${baseUrl}/api/notifications/unsubscribe`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: deviceId, topicId }),
            }).catch(() => {});

            if (Platform.OS === "android") {
              await clearWidgetData();
              await unregisterWidgetRotationTask();
            }
            setWidgetActive(topicId, false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.accent : colors.border,
          borderRadius: 18,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isActive
                ? colors.accent
                : "rgba(255,255,255,0.3)",
            },
          ]}
        >
          <Feather
            name={isActive ? "bell" : "check"}
            size={12}
            color={isActive ? colors.accentForeground : colors.foreground}
          />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isActive ? "Learning flow active" : "Your flow is ready"}
        </Text>
      </View>

      <View style={styles.profileGrid}>
        <ProfileRow icon="book" label="Topic" value={profile.topic} />
        <ProfileRow
          icon="bar-chart-2"
          label="Level"
          value={profile.skillLevel}
        />
        <ProfileRow icon="zap" label="Style" value={profile.learningStyle} />
        <ProfileRow
          icon="clock"
          label="Frequency"
          value={profile.notificationFrequency}
        />
        {profile.quietHours !== "none" && (
          <ProfileRow
            icon="moon"
            label="Quiet hours"
            value={profile.quietHours}
          />
        )}
      </View>

      {isActive ? (
        <View style={styles.activeInfo}>
          <View
            style={[
              styles.activeInfoRow,
              { backgroundColor: "rgba(255,213,102,0.15)" },
            ]}
          >
            <Feather name="bell" size={13} color={colors.accent} />
            <Text style={[styles.activeInfoText, { color: colors.foreground }]}>
              Smart delivery active
            </Text>
            {Platform.OS === "android" && (
              <>
                <Text
                  style={[
                    styles.activeInfoText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  ·
                </Text>
                <Feather
                  name="layout"
                  size={13}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.activeInfoText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Widget active
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity onPress={handleRemoveWidget} activeOpacity={0.7}>
            <Text
              style={[styles.removeText, { color: colors.mutedForeground }]}
            >
              Remove notifications{Platform.OS === "android" ? " & widget" : ""}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.widgetButton,
            {
              backgroundColor: isLoading
                ? "rgba(255,209,102,0.5)"
                : colors.accent,
            },
          ]}
          onPress={handleAddWidget}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.card} />
          ) : (
            <Feather
              name={Platform.OS === "android" ? "layout" : "bell"}
              size={14}
              color={colors.card}
            />
          )}
          <Text style={[styles.widgetButtonText, { color: colors.card }]}>
            {loadingLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1.5,
    boxShadow: "0 1px 2px #261c140a, 0 8px 24px -12px #261c1414",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  profileGrid: {
    gap: 6,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  profileLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    width: 72,
  },
  profileValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textTransform: "capitalize",
  },
  activeInfo: {
    gap: 8,
  },
  activeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeInfoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  removeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  widgetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
  },
  widgetButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
