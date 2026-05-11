import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NewTopicModal } from "@/components/NewTopicModal";
import { TopicCard } from "@/components/TopicCard";
import { useColors } from "@/hooks/useColors";
import { useTopics } from "@/contexts/TopicsContext";
import { cancelTopicNotifications } from "@/services/notifications";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { topics, createTopic, deleteTopic, loading } = useTopics();
  const [modalVisible, setModalVisible] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCreate = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const topic = createTopic(title);
    setModalVisible(false);
    router.push(`/chat/${topic.id}`);
  };

  const handleTopicPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/chat/${id}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 10,
          },
        ]}
      >
        <Text style={[styles.appName, { color: colors.foreground }]}>
          LearnFlow
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          style={[
            styles.newButton,
            { backgroundColor: colors.primary },
          ]}
          hitSlop={8}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {!loading && topics.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: "rgba(255,255,255,0.15)" },
            ]}
          >
            <Feather name="book-open" size={32} color={colors.foreground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Start learning something new
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Tap the + button to create your first learning stream
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setModalVisible(true);
            }}
          >
            <Text
              style={[
                styles.emptyButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              New topic
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TopicCard
              topic={item}
              onPress={() => handleTopicPress(item.id)}
              onDelete={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deleteTopic(item.id);
              }}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!topics.length}
        />
      )}

      <NewTopicModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  newButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
