import StartLearningButton from "@/components/StartLearningButton";
import Card from "@/components/OnboardingCard";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Onboarding from "react-native-onboarding-swiper";

const screenWidth = Dimensions.get("screen").width;
const statusBarHeight = StatusBar.currentHeight;

export default function OnboardingScreen() {
  return (
    <Onboarding
      pages={[
        {
          backgroundColor: "#f7ede2",
          image: (
            <Image
              source={require("@/assets/images/hero.png")}
              style={{
                width: "100%",
                height: screenWidth,
                top: statusBarHeight ? -statusBarHeight : 0,
              }}
            />
          ),
          title: (
            <Text
              style={[
                styles.title,
                {
                  paddingHorizontal: 24,
                },
              ]}
            >
              Learn{"\n"}anything,{"\n"}
              <Text style={{ color: "#f47249", fontStyle: "italic" }}>
                as you live your day.
              </Text>
            </Text>
          ),
          subtitle: (
            <Text
              style={[
                styles.subtitle,
                {
                  paddingHorizontal: 24,
                },
              ]}
            >
              Get bite-sized insights during natural breaks &mdash; while
              commuting, waiting in line, or taking a quick pause. No schedules.
              No study sessions.
            </Text>
          ),
        },
        {
          backgroundColor: "#f7ede2",
          title: (
            <Text
              style={[
                styles.title,
                {
                  top: 54,
                },
              ]}
            >
              Turn spare moments into steady growth.
            </Text>
          ),
          subtitle: <></>,
          image: (
            <View
              style={{
                position: "absolute",
                top: 270,
                width: screenWidth - 16 * 2,
                height: (1434 * (screenWidth - 16 * 2)) / 744,
                alignItems: "center",
                borderRadius: 36,
              }}
            >
              <Image
                style={{
                  width: "100%",
                  height: "100%",
                }}
                source={require("@/assets/images/push-preview-android.png")}
              />
            </View>
          ),
        },
        {
          backgroundColor: "#f7ede2",
          title: (
            <Text
              style={Object.assign({}, styles.title, {
                top: 130,
                marginHorizontal: 24,
              })}
            >
              Built to fit your life
            </Text>
          ),
          subtitle: (
            <>
              <ScrollView
                horizontal={true}
                style={{
                  position: "absolute",
                  top: 300,
                }}
                contentContainerStyle={{
                  gap: 22,
                  paddingHorizontal: 22,
                }}
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
              >
                <Card
                  title="Never overwhelming"
                  description="You control frequency, quiet hours, and exactly when learning snippets appear."
                  iconName="bell-slash"
                  num={1}
                />
                <Card
                  title="No streaks. No guilt."
                  description="Skip anytime. Learning continues naturally whenever you're ready."
                  iconName="brain"
                  num={2}
                />
                <Card
                  title="Designed for memory"
                  description="Short repeated exposure helps concepts stick long-term."
                  iconName="book"
                  num={3}
                />
              </ScrollView>
              <StartLearningButton />
            </>
          ),
          image: <></>,
        },
      ]}
      bottomBarColor="#f7ede2"
      imageContainerStyles={{
        position: "absolute",
        top: 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#190f0b",
    fontSize: 50,
    fontFamily: "serif",
    textAlign: "center",
    position: "absolute",
    bottom: 180,
  },

  subtitle: {
    color: "#6d6059",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    position: "absolute",
    bottom: 80,
    paddingHorizontal: 16,
  },
});
