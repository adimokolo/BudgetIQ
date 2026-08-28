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

import { verifyOTP, resendOTP } from "../services/auth";

export default function VerifyOtpScreen() {
  const router = useRouter();

  // Get email and purpose from the previous screen
  const { email, purpose } = useLocalSearchParams();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const displayEmail = email || "you@example.com";

  const handleVerify = async () => {
    // Check if email exists
    if (!email) {
      Alert.alert("Error", "Email address is missing. Please try again.");
      return;
    }

    // Check if OTP is entered
    if (!code.trim()) {
      Alert.alert(
        "Verification Code Required",
        "Please enter the 6-digit verification code.",
      );
      return;
    }

    // Check OTP length
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

      // Send email and OTP to backend
      const response = await verifyOTP(email, code);

      console.log("OTP verification successful:", response);

      Alert.alert(
        "Success",
        purpose === "reset-password"
          ? "Your code has been verified."
          : "Your account has been verified successfully.",
      );

      // If coming from Forgot Password
      if (purpose === "reset-password") {
        router.replace({
          pathname: "/reset-password",
          params: {
            email,
            otp: code,
          },
        });
      } else {
        // If coming from Signup
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
            placeholderTextColor="#9CA3AF"
            value={code}
            onChangeText={(text) => {
              // Only allow numbers
              setCode(text.replace(/[^0-9]/g, ""));
            }}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
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

            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text
                style={[styles.resendLink, resending && styles.resendDisabled]}
              >
                {resending ? "Sending..." : "Resend it"}
              </Text>
            </TouchableOpacity>
          </View>

          <Link href="/(tabs)/dashboard" asChild>
            <TouchableOpacity>
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
    lineHeight: 17,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    alignSelf: "flex-start",
    marginBottom: 6,
  },

  readOnlyField: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  readOnlyText: {
    fontSize: 14,
    color: "#374151",
  },

  codeInput: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2DD4BF",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 16,
    letterSpacing: 4,
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },

  verifyButton: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "#14274E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  resendRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  resendText: {
    fontSize: 11,
    color: "#6B7280",
  },

  resendLink: {
    fontSize: 11,
    color: "#1B3A6B",
    fontWeight: "700",
  },

  resendDisabled: {
    opacity: 0.5,
  },

  backToLoginLink: {
    fontSize: 12,
    color: "#1B3A6B",
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 10,
  },
});
