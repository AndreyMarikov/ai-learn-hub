import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

function StartLearningButton() {
  return (
    <View style={{
      position: "absolute",
      bottom: 60,
      overflow: "hidden",
      borderRadius: 9999
    }}>
      <Link href="/" asChild>
        <TouchableOpacity style={{
          backgroundColor: "#251712",
          width: 300,
          paddingVertical: 18,
          borderRadius: 9999,
          alignItems: "center",
        }}>
          <Text style={{
            color: "#f7ede2",
            fontWeight: "bold",
            fontSize: 20,
            textTransform: "capitalize"
          }}>
            Start learning passively
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

export default StartLearningButton;
