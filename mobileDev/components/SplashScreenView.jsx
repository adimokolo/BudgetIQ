import { View, Image, Text, StyleSheet } from "react-native";

export default function SplashScreenView() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>KashMetrix</Text>
        <Text style={styles.tagline}>Track smarter. Understand more.</Text>
      </View>

      <Text style={styles.footer}>
        KashMetrix ©️ 2026 B&P DevRights. All rights reserved.
      </Text>
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
  content: {
    alignItems: "center",
  },
  logo: {
    width: 170,
    height: 170,
    marginBottom: 5,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#1B3A6B",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 9,
    fontWeight: "500",
    color: "#1B3A6B",
    letterSpacing: 1,
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    fontSize: 10,
    fontWeight: "400",
    color: "#4d6791",
    textAlign: "center",
    lineHeight: 16,
  },
});
