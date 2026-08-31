import { View, Image, Text, StyleSheet } from "react-native";

export default function SplashScreenView() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>BUDGETIQ</Text>
      <Text style={styles.tagline}>SPEND WITH INSIGHT, NOT GUESSWORK.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 5,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#1B3A6B",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 8,
    fontWeight: "500",
    color: "#1B3A6B",
    letterSpacing: 1,
    marginTop: 6,
  },
});
