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
import { Link, useLocalSearchParams, useRouter } from "expo-router";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");

  const displayEmail = email || "you@example.com";

  const handleVerify = () => {
    console.log("Verifying code", code, "for", displayEmail);
    router.push("/reset-password");
  };

  const handleResend = () => {
    console.log("Resending code to", displayEmail);
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

          <Text style={styles.welcome}>Verify your email</Text>
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
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
            <Text style={styles.verifyButtonText}>Verify account</Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't get a code? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend it</Text>
            </TouchableOpacity>
          </View>

          <Link href="/login" asChild>
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
  },
  verifyButton: {
    width: "100%",
    backgroundColor: "#14274E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 9,
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
  backToLoginLink: {
    fontSize: 12,
    color: "#1B3A6B",
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 10,
  },
});
