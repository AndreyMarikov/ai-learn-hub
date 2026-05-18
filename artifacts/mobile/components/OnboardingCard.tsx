import { StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

type CardProps = {
  title: string,
  description: string,
  iconName: string,
  num: number
};

function Card(props: CardProps) {
  const str = String(props.num);

  return (
    <View style={styles.card}>
      <Icon name={props.iconName} color="#f47249" size={34} />
      <Text style={[styles.title, {
        fontSize: 30,
        position: "relative",
        top: 0,
        textAlign: "left",
        marginTop: 20,
        marginBottom: 20,
      }]}>{props.title}</Text>
      <Text style={[styles.subtitle, {
        position: "relative",
        top: 0,
        width: "100%",
        textAlign: "left",
        paddingHorizontal: 0
      }]}>{props.description}</Text>
      <Text style={{
        position: "absolute",
        paddingHorizontal: 8,
        left: 24,
        top: -10,
        height: 20,
        backgroundColor: "#fef9f1",
        borderRadius: 6,
        fontFamily: "monospace"
      }}>{str.length === 1 ? "0" + str : str}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffdf9",
    padding: 24,
    paddingTop: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5ddd499",
    boxShadow: "0 1px 2px #261c140a, 0 8px 24px -12px #261c1414",
    width: 260,
    marginTop: 9,
    marginBottom: 24,
  },

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
    paddingHorizontal: 16
  },
});

export default Card;
