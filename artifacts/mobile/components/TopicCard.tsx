import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useColors } from "@/hooks/useColors";
import type { Topic } from "@/contexts/TopicsContext";

interface TopicCardProps {
  topic: Topic;
  onPress: () => void;
  onDelete: () => void;
}

export function TopicCard({ topic, onPress, onDelete }: TopicCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef<Swipeable>(null);

  const lastNonWidgetMessage = [...topic.messages]
    .reverse()
    .find((m) => m.role !== "widget");

  const preview = lastNonWidgetMessage
    ? lastNonWidgetMessage.content
        .replace(/LEARNING_PROFILE:\{.*\}/g, "")
        .trim()
        .slice(0, 70) +
      (lastNonWidgetMessage.content.length > 70 ? "..." : "")
    : "Tap to start your learning journey";

  const confirmDelete = () => {
    swipeableRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete topic",
      `Remove "${topic.title}" and all its messages?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete();
          },
        },
      ],
    );
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

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View
        style={[styles.deleteAction, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: "#e53935" }]}
          onPress={confirmDelete}
          activeOpacity={0.85}
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <Text style={styles.deleteLabel}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
      onSwipeableOpen={() =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      enabled={Platform.OS !== "web"}
      containerStyle={styles.swipeContainer}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onLongPress={Platform.OS === "web" ? confirmDelete : undefined}
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
                <View style={styles.badges}>
                  {topic.isReady && (
                    <View
                      style={[
                        styles.readyDot,
                        { backgroundColor: colors.accent },
                      ]}
                    />
                  )}
                  {topic.widgetActive && (
                    <Feather
                      name="bell"
                      size={11}
                      color={colors.accent}
                    />
                  )}
                </View>
              </View>
              <Text
                style={[styles.preview, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {preview}
              </Text>
            </View>

            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 5,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 16,
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
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    width: 80,
  },
  deleteButton: {
    flex: 1,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    gap: 3,
    marginRight: 16
  },
  deleteLabel: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
