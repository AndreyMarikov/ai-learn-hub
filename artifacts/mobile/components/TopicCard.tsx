import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Topic } from "@/contexts/TopicsContext";

interface TopicCardProps {
  topic: Topic;
  onPress: () => void;
  onDelete: () => void;
}

export function TopicCard({ topic, onPress, onDelete }: TopicCardProps) {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(1)).current;

  const lastMessage = topic.messages[topic.messages.length - 1];
  const preview = lastMessage
    ? lastMessage.content.replace(/LEARNING_PROFILE:\{.*\}/g, "").trim().slice(0, 60) +
      (lastMessage.content.length > 60 ? "..." : "")
    : "Tap to start your learning journey";

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Topic", `Remove "${topic.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: 18,
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather name="book-open" size={18} color={colors.primary} />
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {topic.title}
              </Text>
              {topic.isReady && (
                <View
                  style={[styles.readyDot, { backgroundColor: colors.accent }]}
                />
              )}
            </View>
            <Text
              style={[styles.preview, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {preview}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  readyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  preview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
