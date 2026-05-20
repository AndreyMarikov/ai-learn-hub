import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ChatInput } from "@/components/ChatInput";
import { LearningReadyCard } from "@/components/LearningReadyCard";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useColors } from "@/hooks/useColors";
import {
  useTopics,
  type LearningProfile,
  type Message,
} from "@/contexts/TopicsContext";

let msgCounter = 0;
function generateUniqueId(): string {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 9)}`;
}
import { LinearGradient } from "expo-linear-gradient";

function cleanContent(content: string): string {
  return content
    .replace(/\nTOPIC_TITLE:[^\n]*/g, "")
    .replace(/TOPIC_TITLE:[^\n]*/g, "")
    .replace(/\nLEARNING_PROFILE:\{[^\n]*\}/g, "")
    .replace(/LEARNING_PROFILE:\{[^\n]*\}/g, "")
    .trim();
}

function extractTopicTitle(content: string): string | null {
  const match = content.match(/TOPIC_TITLE:([^\n]+)/);
  return match ? match[1].trim() : null;
}

function extractLearningProfile(content: string): LearningProfile | null {
  const match = content.match(/LEARNING_PROFILE:(\{[^\n]+\})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as LearningProfile;
  } catch {
    return null;
  }
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { getTopic, saveMessages, markReady, updateTopicTitle } = useTopics();

  const topic = getTopic(id ?? "");

  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [headerTitle, setHeaderTitle] = useState<string>("...");

  const initializedRef = useRef(false);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (topic && !initializedRef.current) {
      setLocalMessages(topic.messages);
      setIsReady(topic.isReady);
      setHeaderTitle(topic.title);
      initializedRef.current = true;

      if (
        topic.messages.length === 1 &&
        topic.messages[0].role === "user" &&
        !autoSentRef.current
      ) {
        autoSentRef.current = true;
        doStream(topic.messages, true);
      }
    }
  }, [topic]);

  useEffect(() => {
    if (topic?.title && topic.title !== "...") {
      setHeaderTitle(topic.title);
    }
  }, [topic?.title]);


  const doStream = useCallback(
    async (currentMessages: Message[], isFirstMessage = false) => {
      if (isStreaming) return;

      setIsStreaming(true);
      setShowTyping(true);

      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const baseUrl = domain ? `https://${domain}` : "";
      let fullContent = "";
      let assistantMsgId = "";

      const apiMessages = currentMessages
        .filter((m) => m.role !== "widget")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch(`${baseUrl}/api/gemini/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ messages: apiMessages, isFirstMessage }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                done?: boolean;
              };
              if (parsed.content) {
                fullContent += parsed.content;
                const displayContent = cleanContent(fullContent);

                if (!assistantMsgId) {
                  setShowTyping(false);
                  const newId = generateUniqueId();
                  assistantMsgId = newId;
                  setLocalMessages((prev) => [
                    ...prev,
                    {
                      id: newId,
                      role: "assistant",
                      content: displayContent,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                } else {
                  setLocalMessages((prev) => {
                    const updated = [...prev];
                    const idx = updated.findIndex(
                      (m) => m.id === assistantMsgId,
                    );
                    if (idx !== -1) {
                      updated[idx] = {
                        ...updated[idx],
                        content: displayContent,
                      };
                    }
                    return updated;
                  });
                }
              }
            } catch {}
          }
        }

        const extractedTitle = extractTopicTitle(fullContent);
        if (extractedTitle && isFirstMessage) {
          updateTopicTitle(id ?? "", extractedTitle);
          setHeaderTitle(extractedTitle);
        }

        const profile = extractLearningProfile(fullContent);
        const displayContent = cleanContent(fullContent);
        const isReadyNow =
          fullContent.includes("Your learning flow is ready") ||
          profile !== null;

        if (assistantMsgId) {
          setLocalMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === assistantMsgId);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], content: displayContent };
            }
            return updated;
          });
        }

        const aiMessage: Message = {
          id: assistantMsgId || generateUniqueId(),
          role: "assistant",
          content: displayContent,
          createdAt: new Date().toISOString(),
        };

        const messagesWithAI = [
          ...currentMessages.filter((m) => m.role !== "widget"),
          aiMessage,
        ];

        if (isReadyNow && profile) {
          setIsReady(true);
          markReady(id ?? "", profile);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          const widgetMsg: Message = {
            id: generateUniqueId(),
            role: "widget",
            content: JSON.stringify(profile),
            createdAt: new Date().toISOString(),
          };

          const allMessages = [...messagesWithAI, widgetMsg];
          setLocalMessages(allMessages);
          saveMessages(id ?? "", allMessages);
        } else {
          saveMessages(id ?? "", messagesWithAI);
        }
      } catch {
        setShowTyping(false);
        const errorMsg: Message = {
          id: generateUniqueId(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setLocalMessages((prev) => [...prev, errorMsg]);
        saveMessages(id ?? "", [
          ...currentMessages.filter((m) => m.role !== "widget"),
          errorMsg,
        ]);
      } finally {
        setIsStreaming(false);
        setShowTyping(false);
      }
    },
    [id, isStreaming, saveMessages, markReady, updateTopicTitle],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userMsg: Message = {
        id: generateUniqueId(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...localMessages, userMsg];
      setLocalMessages(updatedMessages);
      await doStream(updatedMessages, false);
    },
    [localMessages, isStreaming, doStream],
  );

  const reversed = [...localMessages].reverse();

  const topPadding = Platform.OS === "web" ? 67 : 0;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 10,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {headerTitle}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={30}
      >
        <FlatList
          data={reversed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.role === "widget") {
              try {
                const profile = JSON.parse(item.content) as LearningProfile;
                return (
                  <LearningReadyCard profile={profile} topicId={id ?? ""} />
                );
              } catch {
                return null;
              }
            }
            return <MessageBubble message={item} />;
          }}
          inverted={!!localMessages.length}
          scrollEnabled={!!localMessages.length}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.inputArea}>
          <ChatInput
            onSend={handleSend}
            disabled={isStreaming}
            placeholder={
              isReady ? "Ask anything or adjust your setup..." : "Message..."
            }
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "serif",
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 12,
  },
  inputArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
});
