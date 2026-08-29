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

import { forgotPassword } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";

export default function ForgetPasswordScreen() {
  const router = useRouter();

  // Theme
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert(
        "Email required",
        "Please enter the email address associated with your account.",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await forgotPassword(trimmedEmail);

      Alert.alert(
        "Reset code sent",
        "We've sent a password reset code to your email address.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.push({
                pathname: "/verify-otp",
                params: {
                  email: trimmedEmail,
                },
              });
            },
          },
        ],
      );
    } catch (error) {
      console.log("Forgot password error:", error);

      let errorMessage =
        "Unable to send the password reset code. Please try again.";

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

      Alert.alert("Reset password", errorMessage);
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

          <Text style={styles.welcome}>Reset your password</Text>

          <Text style={styles.subtext}>
            Enter the email on your account and we'll send you a reset code.
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSendResetLink}
          />

          {/* SEND RESET LINK */}

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleSendResetLink}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primaryText} />

                <Text style={styles.resetButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text style={styles.resetButtonText}>Send reset link</Text>
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

/*
|--------------------------------------------------------------------------
| THEME-AWARE STYLES
|--------------------------------------------------------------------------
*/

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
      width: 75,
      height: 75,
      marginBottom: 5,
    },

    brand: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: 3,
    },

    tagline: {
      fontSize: 8,
      fontWeight: "500",
      color: colors.textMuted,
      letterSpacing: 1,
      marginTop: 4,
      marginBottom: 48,
    },

    welcome: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      alignSelf: "flex-start",
    },

    subtext: {
      fontSize: 11,
      color: colors.textMuted,
      alignSelf: "flex-start",
      marginTop: 4,
      marginBottom: 20,
      lineHeight: 17,
    },

    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      alignSelf: "flex-start",
      marginBottom: 6,
    },

    input: {
      width: "100%",
      backgroundColor: colors.inputBg,

      borderWidth: 1,
      borderColor: colors.inputBorder,

      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,

      fontSize: 14,
      color: colors.text,

      marginBottom: 16,
    },

    resetButton: {
      width: "100%",
      backgroundColor: colors.primary,

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
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
    },

    backToLoginLink: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "700",
      textDecorationLine: "underline",
      marginTop: 18,
    },
  });
