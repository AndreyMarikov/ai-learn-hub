import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Message...",
}: ChatInputProps) {
  const colors = useColors();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const sendScale = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const handleSendPressIn = () => {
    Animated.spring(sendScale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handleSendPressOut = () => {
    Animated.spring(sendScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "rgba(255,255,255,0.18)",
          borderColor: colors.border,
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            color: colors.foreground,
            fontFamily: "Inter_400Regular",
          },
        ]}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="rgba(16, 42, 41, 0.5)"
        multiline
        maxLength={1000}
        blurOnSubmit={false}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        editable={!disabled}
      />
      <Animated.View style={{ transform: [{ scale: sendScale }] }}>
        <Pressable
          onPress={handleSend}
          onPressIn={handleSendPressIn}
          onPressOut={handleSendPressOut}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? colors.primary : "rgba(16, 42, 41, 0.15)",
            },
          ]}
        >
          <Feather
            name="arrow-up"
            size={18}
            color={canSend ? colors.primaryForeground : "rgba(16,42,41,0.4)"}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: Platform.OS === "ios" ? 2 : 0,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
});
