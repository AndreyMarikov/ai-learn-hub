import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

import { NewTopicModal } from "@/components/NewTopicModal";
import { TopicCard } from "@/components/TopicCard";
import { useColors } from "@/hooks/useColors";
import { useTopics } from "@/contexts/TopicsContext";
import { cancelTopicNotifications } from "@/services/notifications";
import { useFonts } from "@expo-google-fonts/nunito";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { topics, createTopic, deleteTopic, loading } = useTopics();
  const [modalVisible, setModalVisible] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [fontsLoaded] = useFonts({
    "Nunito-Bold": require("./assets/fonts/Nunito-Bold.ttf")
  })

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('HAS_LAUNCHED');
        if (hasLaunched === null) {
          // This is the first time opening the app
          await AsyncStorage.setItem('HAS_LAUNCHED', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  if (isFirstLaunch) {
    return <Redirect href="/onboarding" />
  }

  const handleCreate = (initialMessage: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const topic = createTopic(initialMessage);
    setModalVisible(false);
    router.push(`/chat/${topic.id}`);
  };

  const handleDelete = async (id: string) => {
    await cancelTopicNotifications(id);
    deleteTopic(id);
  };

  const handleTopicPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/chat/${id}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header]}>
        <Text style={[styles.appName, { color: colors.accent }]}>
          Absorbly
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          style={[styles.newButton, { backgroundColor: colors.primary }]}
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
          <Text
            style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
          >
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
              style={[styles.emptyButtonText, { color: colors.background }]}
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
                handleDelete(item.id);
              }}
            />
          )}
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
    paddingVertical: 10,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Nunito-Bold",
    fontWeight: "bold",
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
    fontSize: 32,
    fontFamily: "serif",
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
