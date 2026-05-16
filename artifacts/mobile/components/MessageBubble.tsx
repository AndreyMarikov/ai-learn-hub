import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Message } from "@/contexts/TopicsContext";

interface MessageBubbleProps {
  message: Message;
}

function cleanContent(content: string): string {
  return content.replace(/LEARNING_PROFILE:\{[^}]*\}/g, "").trim();
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useColors();
  const isUser = message.role === "user";
  const displayContent = cleanContent(message.content);

  if (!displayContent) return null;

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: "rgba(0,0,0,0.07)" }]
            : [styles.assistantBubble, { backgroundColor: colors.card }],
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: colors.messageText,
            },
          ]}
        >
          {displayContent}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 3,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  assistantContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    boxShadow: "0 1px 2px #261c140a, 0 8px 24px -12px #261c1414",
  },
  userBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 5,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
