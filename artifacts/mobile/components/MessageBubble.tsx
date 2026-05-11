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
            ? [styles.userBubble, { backgroundColor: colors.userMessage }]
            : [styles.assistantBubble, { backgroundColor: colors.assistantMessage }],
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser ? colors.userMessageText : colors.assistantMessageText,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
