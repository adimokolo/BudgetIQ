import { useState } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Logging in with", email, password);
    router.push("/(tabs)/dashboard");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>BUDGETIQ</Text>
          <Text style={styles.tagline}>SPEND WITH INSIGHT, NOT GUESSWORK.</Text>

          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.subtext}>
            Log in to see where your money's been.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="**********"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Link href="/forget-password" asChild>
            <TouchableOpacity style={styles.forgotPasswordRow}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to BudgetIQ? </Text>
            <Link href="/create-account" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Create an account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  logo: {
    width: 75,
    height: 75,
    marginBottom: 5,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B3A6B",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 8,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 48,
  },
  welcome: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    alignSelf: "flex-start",
  },
  subtext: {
    fontSize: 11,
    color: "#6B7280",
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
  },
  forgotPasswordRow: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 11,
    color: "#1B3A6B",
    fontWeight: "700",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#14274E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 25,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  signupRow: {
    flexDirection: "row",
    marginTop: 18,
  },
  signupText: {
    fontSize: 11,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 11,
    color: "#1B3A6B",
    fontWeight: "700",
  },
});
