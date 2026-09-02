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

import { Ionicons } from "@expo/vector-icons";

import { Link, useLocalSearchParams, useRouter } from "expo-router";

import { resetPassword } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { email, otp } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert(
        "Missing information",
        "Please fill in both password fields.",
      );
      return;
    }

    if (trimmedPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Your password must be at least 8 characters.",
      );
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert(
        "Passwords don't match",
        "Please make sure both passwords match.",
      );
      return;
    }

    if (!email || !otp) {
      Alert.alert(
        "Session expired",
        "We couldn't verify your reset code. Please start the password reset process again.",
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

      await resetPassword(
        Array.isArray(email) ? email[0] : email,
        Array.isArray(otp) ? otp[0] : otp,
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
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.brand}>BUDGETIQ</Text>

          <Text style={styles.tagline}>SPEND WITH INSIGHT, NOT GUESSWORK.</Text>

          <Text style={styles.welcome}>Create new password</Text>

          <Text style={styles.subtext}>
            Choose a new password for your account.
          </Text>

          <Text style={styles.label}>New password</Text>

          {/* New password with eye toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((current) => !current)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.textFaint}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm password</Text>

          {/* Confirm password with eye toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textFaint}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleResetPassword}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((current) => !current)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.textFaint}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primaryText} />

                <Text style={styles.resetButtonText}>Resetting...</Text>
              </View>
            ) : (
              <Text style={styles.resetButtonText}>Reset password</Text>
            )}
          </TouchableOpacity>

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

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 32,
      paddingHorizontal: 28,
      alignItems: "center",

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: colors.mode === "dark" ? 0.25 : 0.08,
      shadowRadius: 12,
      elevation: 3,

      borderWidth: 1,
      borderColor: colors.cardBorder,
    },

    logo: {
      width: 100,
      height: 100,
      marginBottom: -10,
    },

    brand: {
      fontSize: 20,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.primary,
      letterSpacing: 3,
    },

    tagline: {
      fontSize: 8,
      fontFamily: "Inter_500Medium",
      color: colors.textMuted,
      letterSpacing: 1,
      marginTop: 4,
      marginBottom: 48,
    },

    welcome: {
      fontSize: 17,
      fontFamily: "SpaceGrotesk_600SemiBold",
      color: colors.text,
      alignSelf: "flex-start",
    },

    subtext: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
      alignSelf: "flex-start",
      marginTop: 4,
      marginBottom: 20,
    },

    label: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      alignSelf: "flex-start",
      marginBottom: 6,
    },

    /*
    |--------------------------------------------------------------------------
    | PASSWORD INPUT WITH EYE BUTTON
    |--------------------------------------------------------------------------
    */

    passwordContainer: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      marginBottom: 16,
    },

    passwordInput: {
      flex: 1,
      paddingVertical: 10,
      paddingLeft: 14,
      paddingRight: 8,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },

    eyeButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },

    resetButton: {
      width: "100%",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      minHeight: 48,
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
      color: colors.primaryText,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },

    backToLoginLink: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      textDecorationLine: "underline",
      marginTop: 18,
    },
  });
