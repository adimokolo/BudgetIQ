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
  Alert,
  ActivityIndicator,
} from "react-native";

import { Link, useRouter } from "expo-router";
import { loginUser } from "../services/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // -----------------------------
    // Validate email
    // -----------------------------

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Email Required", "Please enter your email.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // -----------------------------
    // Validate password
    // -----------------------------

    if (!password) {
      Alert.alert("Password Required", "Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      console.log("Attempting login for:", cleanEmail);

      // -----------------------------
      // Call backend
      // -----------------------------

      const response = await loginUser(cleanEmail, password);

      console.log("LOGIN SUCCESS:", response);

      /*
      The loginUser() function saves the JWT token
      to AsyncStorage.

      Example backend response:

      {
        token: "...",
        user: {
          id: "...",
          full_name: "Pedro Ahmed",
          email: "example@gmail.com",
          currency: "NGN",
          is_verified: true
        }
      }
      */

      if (!response?.token) {
        throw {
          message: "Login succeeded but no authentication token was returned.",
        };
      }

      // -----------------------------
      // Navigate to dashboard
      // -----------------------------

      router.replace("/dashboard");
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      console.log("LOGIN ERROR MESSAGE:", error?.message);
      console.log("LOGIN ERROR DATA:", error);

      // -----------------------------
      // Account not verified
      // -----------------------------

      if (error?.requiresVerification) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in.",
          [
            {
              text: "Verify Email",
              onPress: () => {
                router.push({
                  pathname: "/verify-otp",
                  params: {
                    email: error.email || cleanEmail,
                    purpose: "signup",
                  },
                });
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );

        return;
      }

      // -----------------------------
      // Normal login error
      // -----------------------------

      Alert.alert(
        "Login Failed",
        error?.error ||
          error?.message ||
          "Unable to log in. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Logo */}

          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Brand */}

          <Text style={styles.brand}>BUDGETIQ</Text>

          <Text style={styles.tagline}>SPEND WITH INSIGHT, NOT GUESSWORK.</Text>

          {/* Heading */}

          <Text style={styles.welcome}>Welcome back</Text>

          <Text style={styles.subtext}>
            Log in to see where your money's been.
          </Text>

          {/* Email */}

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          {/* Password */}

          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="**********"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {/* Forgot Password */}

          <Link href="/forget-password" asChild>
            <TouchableOpacity
              style={styles.forgotPasswordRow}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          {/* Login Button */}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />

                <Text style={styles.loadingText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Create Account */}

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to BudgetIQ? </Text>

            <Link href="/create-account" asChild>
              <TouchableOpacity disabled={loading}>
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    justifyContent: "center",
    marginTop: 25,
    minHeight: 48,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
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
