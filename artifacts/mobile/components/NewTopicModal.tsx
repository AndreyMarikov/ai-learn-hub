import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface NewTopicModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (initialMessage: string) => void;
}

const SUGGESTIONS = [
  "Japanese language",
  "Investing basics",
  "Quantum physics",
  "History of Rome",
  "Machine learning",
  "Stoic philosophy",
];

function suggestionToMessage(s: string): string {
  return `I want to learn ${s.toLowerCase()}.`;
}

export function NewTopicModal({ visible, onClose, onCreate }: NewTopicModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleCreate = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setText("");
  };

  const handleSuggestion = (s: string) => {
    onCreate(suggestionToMessage(s));
    setText("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.avoidingView}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + 16,
                borderRadius: 28,
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.handle} />

            <Text style={[styles.title, { color: colors.foreground }]}>
              What do you want to learn?
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Describe your topic and we'll set up your personal learning stream
            </Text>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { color: colors.foreground, fontFamily: "Inter_400Regular" },
                ]}
                value={text}
                onChangeText={setText}
                placeholder="e.g. I want to learn Japanese"
                placeholderTextColor="rgba(16,42,41,0.45)"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                maxLength={200}
              />
            </View>

            <Text style={[styles.suggestionsLabel, { color: colors.mutedForeground }]}>
              Or pick a topic
            </Text>

            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: "rgba(255,255,255,0.25)",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSuggestion(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: colors.foreground }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: text.trim()
                    ? colors.primary
                    : "rgba(31,111,106,0.35)",
                },
              ]}
              onPress={handleCreate}
              disabled={!text.trim()}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.createButtonText,
                  {
                    color: text.trim()
                      ? colors.primaryForeground
                      : "rgba(244,241,234,0.5)",
                  },
                ]}
              >
                Start Learning
              </Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,30,30,0.5)",
    justifyContent: "flex-end",
  },
  avoidingView: {
    justifyContent: "flex-end",
  },
  sheet: {
    margin: 8,
    padding: 24,
    paddingTop: 16,
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(16,42,41,0.2)",
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: -6,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: -6,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  createButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  createButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
