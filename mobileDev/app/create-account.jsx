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

import { Link, useRouter } from "expo-router";
import { registerUser } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";

const CURRENCIES = [
  { code: "NGN", label: "NGN — Naira" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — Pound Sterling" },
  { code: "EUR", label: "EUR — Euro" },
];

function CurrencyDropdown({ value, onChange, colors, styles }) {
  const [open, setOpen] = useState(false);

  const selected =
    CURRENCIES.find((currency) => currency.code === value) || CURRENCIES[0];

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

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("NGN");

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleTermsToggle = () => {
    if (loading) return;

    setTermsAccepted((current) => !current);
  };

  const handleSignup = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(cleanEmail)) {
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

    if (!termsAccepted) {
      Alert.alert(
        "Agreement Required",
        "Please agree to the Terms of Service and Privacy Policy before creating your account.",
      );
      return;
    }

    try {
      setLoading(true);

      console.log("Creating account for:", cleanEmail);

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
        [
          {
            text: "Verify Email",
            onPress: () => {
              router.push({
                pathname: "/verify-otp",
                params: {
                  email: cleanEmail,
                  purpose: "signup",
                },
              });
            },
          },
        ],
      );
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

          <Text style={styles.welcome}>Create your account</Text>

          <Text style={styles.subtext}>
            Clarity for your income and spending starts here.
          </Text>

          <Text style={styles.label}>Full name</Text>

          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor={colors.textFaint}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

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
          />

          <Text style={styles.label}>Password</Text>

          {/* Password input with eye toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="**********"
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

          <Text style={styles.label}>Currency</Text>

          <CurrencyDropdown
            value={currency}
            onChange={setCurrency}
            colors={colors}
            styles={styles}
          />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={handleTermsToggle}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View
              style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
            >
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primaryText} size="small" />

                <Text style={styles.loadingText}>Creating account...</Text>
              </View>
            ) : (
              <Text style={styles.signupButtonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>

            <Link href="/" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
      marginTop: 2,
      marginBottom: 35,
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

    input: {
      width: "100%",
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      marginBottom: 16,
    },

    // Password field
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

    dropdownWrap: {
      width: "100%",
      marginBottom: 5,
      zIndex: 10,
    },

    dropdownField: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },

    dropdownFieldOpen: {
      borderColor: colors.primary,
    },

    dropdownFieldText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },

    chevron: {
      fontSize: 16,
      color: colors.textMuted,
    },

    chevronOpen: {
      color: colors.primary,
    },

    dropdownList: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 2,

      backgroundColor: colors.card,

      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,

      overflow: "hidden",

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: colors.mode === "dark" ? 0.3 : 0.12,
      shadowRadius: 10,
      elevation: 6,
    },

    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },

    dropdownItemSelected: {
      backgroundColor: colors.primary,
    },

    dropdownItemText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },

    dropdownItemTextSelected: {
      color: colors.primaryText,
      fontFamily: "Inter_600SemiBold",
    },

    termsRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 8,
    },

    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.textFaint,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 1,
      flexShrink: 0,
    },

    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    checkmark: {
      color: colors.primaryText,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },

    termsText: {
      flex: 1,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
      color: colors.textMuted,
    },

    termsLink: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },

    signupButton: {
      width: "100%",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      minHeight: 48,
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    signupButtonText: {
      color: colors.primaryText,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },

    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    loadingText: {
      color: colors.primaryText,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },

    loginRow: {
      flexDirection: "row",
      marginTop: 18,
    },

    loginText: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },

    loginLink: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      textDecorationLine: "underline",
      color: colors.primary,
    },
  });
