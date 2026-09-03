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

import { verifyOTP, verifyResetOTP, resendOTP } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";

export default function VerifyOtpScreen() {
  const router = useRouter();

  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { email, purpose } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const displayEmail = email || "you@example.com";

  const handleVerify = async () => {
    if (!email) {
      Alert.alert("Error", "Email address is missing. Please try again.");
      return;
    }

    if (!code.trim()) {
      Alert.alert(
        "Verification Code Required",
        "Please enter the 6-digit verification code.",
      );
      return;
    }

    if (code.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter a valid 6-digit verification code.",
      );
      return;
    }

    try {
      setLoading(true);

      console.log("Verifying OTP:", {
        email,
        code,
        purpose,
      });

      const response =
        purpose === "reset-password"
          ? await verifyResetOTP(email, code)
          : await verifyOTP(email, code);

      console.log("OTP verification successful:", response);

      Alert.alert(
        "Success",
        purpose === "reset-password"
          ? "Your code has been verified."
          : "Your account has been verified successfully.",
      );

      if (purpose === "reset-password") {
        router.replace({
          pathname: "/reset-password",
          params: {
            email,
            otp: code,
          },
        });
      } else {
        router.replace("/");
      }
    } catch (error) {
      console.log("OTP verification error:", error);

      Alert.alert(
        "Verification Failed",
        error?.message ||
          error?.error ||
          "Invalid or expired verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Error", "Email address is missing.");
      return;
    }

    try {
      setResending(true);

      console.log("Resending OTP to:", email);

      const response = await resendOTP(email);

      console.log("OTP resent successfully:", response);

      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email.",
      );
    } catch (error) {
      console.log("Resend OTP error:", error);

      Alert.alert(
        "Unable to Resend",
        error?.message ||
          error?.error ||
          "Unable to resend the verification code.",
      );
    } finally {
      setResending(false);
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

          <Text style={styles.welcome}>
            {purpose === "reset-password"
              ? "Verify reset code"
              : "Verify your email"}
          </Text>

          <Text style={styles.subtext}>
            Enter the 6-digit code we sent to your inbox. It expires in 10
            minutes.
          </Text>

          <Text style={styles.label}>Email</Text>

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{displayEmail}</Text>
          </View>

          <Text style={styles.label}>Verification code</Text>

          <TextInput
            style={styles.codeInput}
            placeholder="000000"
            placeholderTextColor={colors.textFaint}
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, ""));
            }}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primaryText} size="small" />

                <Text style={styles.verifyButtonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.verifyButtonText}>
                {purpose === "reset-password"
                  ? "Verify code"
                  : "Verify account"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't get a code? </Text>

            <TouchableOpacity
              onPress={handleResend}
              disabled={resending || loading}
            >
              <Text
                style={[styles.resendLink, resending && styles.resendDisabled]}
              >
                {resending ? "Sending..." : "Resend it"}
              </Text>
            </TouchableOpacity>
          </View>

          <Link href="/" asChild>
            <TouchableOpacity disabled={loading || resending}>
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

      borderWidth: 1,
      borderColor: colors.cardBorder,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: colors.mode === "dark" ? 0.25 : 0.08,

      shadowRadius: 12,

      elevation: 3,
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
      lineHeight: 17,
    },

    label: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      alignSelf: "flex-start",
      marginBottom: 6,
    },

    readOnlyField: {
      width: "100%",
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,
      marginBottom: 16,
    },

    readOnlyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },

    codeInput: {
      width: "100%",
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      fontSize: 12,
      fontFamily: "JetBrainsMono_500Medium",
      letterSpacing: 4,
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    verifyButton: {
      width: "100%",
      minHeight: 48,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
    },
    buttonDisabled: {
      opacity: 0.7,
    },

    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    verifyButtonText: {
      color: colors.primaryText,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    resendRow: {
      flexDirection: "row",
      marginTop: 18,
    },
    resendText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
    resendLink: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
    resendDisabled: {
      opacity: 0.5,
    },

    backToLoginLink: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      textDecorationLine: "underline",
      marginTop: 10,
    },
  });
