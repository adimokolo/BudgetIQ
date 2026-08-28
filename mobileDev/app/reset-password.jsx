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
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import { resetPassword } from "../services/auth";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const { email } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Check fields
    if (!trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert(
        "Missing information",
        "Please fill in both password fields.",
      );
      return;
    }

    // Check password length
    if (trimmedPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Your password must be at least 8 characters.",
      );
      return;
    }

    // Check passwords
    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert(
        "Passwords don't match",
        "Please make sure both passwords match.",
      );
      return;
    }

    // Make sure email exists
    if (!email) {
      Alert.alert(
        "Session expired",
        "We couldn't find your email address. Please start the password reset process again.",
        [
          {
            text: "Start again",
            onPress: () => router.replace("/forget-password"),
          },
        ],
      );

      return;
    }

    try {
      setLoading(true);

      // Call backend
      await resetPassword(
        Array.isArray(email) ? email[0] : email,
        trimmedPassword,
      );

      Alert.alert(
        "Password reset successful",
        "Your password has been changed successfully. You can now log in with your new password.",
        [
          {
            text: "Go to login",
            onPress: () => router.replace("/"),
          },
        ],
      );
    } catch (error) {
      console.log("Reset password error:", error);

      let errorMessage = "Unable to reset your password. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.errors) {
        if (Array.isArray(error.errors)) {
          errorMessage = error.errors.join("\n");
        }
      }

      Alert.alert("Password reset failed", errorMessage);
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* LOGO */}
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.brand}>BUDGETIQ</Text>

          <Text style={styles.tagline}>SPEND WITH INSIGHT, NOT GUESSWORK.</Text>

          {/* TITLE */}
          <Text style={styles.welcome}>Create new password</Text>

          <Text style={styles.subtext}>
            Choose a new password for your account.
          </Text>

          {/* NEW PASSWORD */}
          <Text style={styles.label}>New password</Text>

          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm password</Text>

          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            onSubmitEditing={handleResetPassword}
            returnKeyType="done"
          />

          {/* RESET BUTTON */}
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={styles.resetButtonText}>Resetting...</Text>
              </View>
            ) : (
              <Text style={styles.resetButtonText}>Reset password</Text>
            )}
          </TouchableOpacity>

          {/* BACK TO LOGIN */}
          <Link href="/" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={styles.backToLoginLink}>Back to log in</Text>
            </TouchableOpacity>
          </Link>
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

  resetButton: {
    width: "100%",
    backgroundColor: "#14274E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    minHeight: 44,
  },

  resetButtonDisabled: {
    opacity: 0.7,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  backToLoginLink: {
    fontSize: 12,
    color: "#1B3A6B",
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 18,
  },
});
