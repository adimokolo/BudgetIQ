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
import { registerUser } from "../services/auth";

const CURRENCIES = [
  { code: "NGN", label: "NGN — Naira" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — Pound Sterling" },
  { code: "EUR", label: "EUR — Euro" },
];

function CurrencyDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const selected = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity
        style={[styles.dropdownField, open && styles.dropdownFieldOpen]}
        activeOpacity={0.8}
        onPress={() => setOpen((current) => !current)}
      >
        <Text style={styles.dropdownFieldText}>{selected.label}</Text>

        <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          {CURRENCIES.map((currency) => {
            const isSelected = currency.code === value;

            return (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.dropdownItem,
                  isSelected && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  onChange(currency.code);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    isSelected && styles.dropdownItemTextSelected,
                  ]}
                >
                  {currency.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Password Required", "Please enter a password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password Too Short",
        "Your password must be at least 6 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      const cleanEmail = email.trim().toLowerCase();

      const response = await registerUser({
        fullName: fullName.trim(),
        email: cleanEmail,
        password: password,
        currency: currency,
      });

      console.log("Registration successful:", response);

      Alert.alert(
        "Account Created",
        "Your account has been created successfully. Please verify your email.",
      );

      router.push({
        pathname: "/verify-otp",
        params: {
          email: cleanEmail,
          purpose: "signup",
        },
      });
    } catch (error) {
      console.log("Signup error:", error);

      Alert.alert(
        "Registration Failed",
        error?.message ||
          error?.error ||
          "Unable to create your account. Please try again.",
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
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.brand}>BUDGETIQ</Text>

          <Text style={styles.tagline}>SPEND WITH INSIGHT, NOT GUESSWORK.</Text>

          <Text style={styles.welcome}>Create your account</Text>

          <Text style={styles.subtext}>
            Clarity for your income and spending starts here.
          </Text>

          <Text style={styles.label}>Full name</Text>

          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

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

          <Text style={styles.label}>Currency</Text>

          <CurrencyDropdown value={currency} onChange={setCurrency} />

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signupButtonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>

            <Link href="/(tabs)/dashboard" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Log in</Text>
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
    marginBottom: 32,
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

  /* Currency Dropdown */

  dropdownWrap: {
    width: "100%",
    marginBottom: 16,
    zIndex: 10,
  },

  dropdownField: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },

  dropdownFieldOpen: {
    borderColor: "#2DD4BF",
  },

  dropdownFieldText: {
    fontSize: 14,
    color: "#111827",
  },

  chevron: {
    fontSize: 14,
    color: "#6B7280",
  },

  chevronOpen: {
    color: "#2DD4BF",
  },

  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  dropdownItemSelected: {
    backgroundColor: "#2563EB",
  },

  dropdownItemText: {
    fontSize: 13,
    color: "#111827",
  },

  dropdownItemTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* Signup Button */

  signupButton: {
    width: "100%",
    backgroundColor: "#14274E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    minHeight: 48,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Login */

  loginRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  loginText: {
    fontSize: 11,
    color: "#6B7280",
  },

  loginLink: {
    fontSize: 11,
    color: "#1B3A6B",
    fontWeight: "700",
  },
});
