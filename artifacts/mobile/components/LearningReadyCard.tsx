import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { LearningProfile } from "@/contexts/TopicsContext";

interface LearningReadyCardProps {
  profile: LearningProfile;
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
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

export function LearningReadyCard({ profile }: LearningReadyCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.accent,
          borderRadius: 18,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Feather name="check" size={12} color={colors.accentForeground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Learning flow active
        </Text>
      </View>

      <View style={styles.profileGrid}>
        <ProfileRow icon="book" label="Topic" value={profile.topic} />
        <ProfileRow icon="bar-chart-2" label="Level" value={profile.skillLevel} />
        <ProfileRow icon="zap" label="Style" value={profile.learningStyle} />
        <ProfileRow icon="clock" label="Frequency" value={profile.notificationFrequency} />
        {profile.quietHours !== "none" && (
          <ProfileRow icon="moon" label="Quiet hours" value={profile.quietHours} />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.widgetButton,
          { backgroundColor: colors.accent },
        ]}
        activeOpacity={0.8}
      >
        <Feather name="grid" size={14} color={colors.accentForeground} />
        <Text style={[styles.widgetButtonText, { color: colors.accentForeground }]}>
          Add Widget
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  widgetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  widgetButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
