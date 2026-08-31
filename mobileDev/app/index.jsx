import { useEffect, useState } from "react";
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { loginUser } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";

const REMEMBER_LOGIN_KEY = "@budgetiq_remember_login";
const SAVED_EMAIL_KEY = "@budgetiq_saved_email";

export default function LoginScreen() {
  const router = useRouter();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [rememberLogin, setRememberLogin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingSavedLogin, setLoadingSavedLogin] = useState(true);

  useEffect(() => {
    const loadRememberedLogin = async () => {
      try {
        const rememberValue = await AsyncStorage.getItem(REMEMBER_LOGIN_KEY);

        const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);

        const shouldRemember = rememberValue === "true";

        setRememberLogin(shouldRemember);

        if (shouldRemember && savedEmail) {
          setEmail(savedEmail);

          console.log("Remembered login email loaded:", savedEmail);
        }
      } catch (error) {
        console.log("Load remembered login error:", error);
      } finally {
        setLoadingSavedLogin(false);
      }
    };

    loadRememberedLogin();
  }, []);

  const handleRememberLogin = async () => {
    try {
      const newValue = !rememberLogin;

      setRememberLogin(newValue);

      if (newValue) {
        await AsyncStorage.setItem(REMEMBER_LOGIN_KEY, "true");

        console.log("Remember login enabled");
      } else {
        await AsyncStorage.removeItem(REMEMBER_LOGIN_KEY);

        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);

        console.log("Remember login disabled");
      }
    } catch (error) {
      console.log("Remember login toggle error:", error);
    }
  };

  const handleLogin = async () => {
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

    if (!password) {
      Alert.alert("Password Required", "Please enter your password.");

      return;
    }

    try {
      setLoading(true);

      console.log("Attempting login for:", cleanEmail);

      const response = await loginUser(cleanEmail, password);

      console.log("LOGIN SUCCESS:", response);

      if (!response?.token) {
        throw {
          message: "Login succeeded but no authentication token was returned.",
        };
      }

      if (rememberLogin) {
        await AsyncStorage.setItem(REMEMBER_LOGIN_KEY, "true");

        await AsyncStorage.setItem(SAVED_EMAIL_KEY, cleanEmail);

        console.log("Login remembered for:", cleanEmail);
      } else {
        await AsyncStorage.removeItem(REMEMBER_LOGIN_KEY);

        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);

        console.log("Login will not be remembered");
      }

      router.replace("/dashboard");
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      console.log("LOGIN ERROR MESSAGE:", error?.message);

      console.log("LOGIN ERROR DATA:", error);

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

          <Text style={styles.welcome}>Welcome back</Text>

          <Text style={styles.subtext}>
            Log in to see where your money's been.
          </Text>

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
            editable={!loading && !loadingSavedLogin}
          />

          <Text style={styles.label}>Password</Text>

          {/* Password input with eye button */}
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
                size={17}
                color={colors.textFaint}
              />
            </TouchableOpacity>
          </View>

          <Link href="/forget-password" asChild>
            <TouchableOpacity
              style={styles.forgotPasswordRow}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={handleRememberLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View
              style={[styles.checkbox, rememberLogin && styles.checkboxChecked]}
            >
              {rememberLogin && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <Text style={styles.rememberText}>Remember my login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading || loadingSavedLogin}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primaryText} size="small" />

                <Text style={styles.loadingText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

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
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      marginBottom: 16,
    },

    /*
    |--------------------------------------------------------------------------
    | PASSWORD INPUT
    |--------------------------------------------------------------------------
    */

    passwordContainer: {
      width: "100%",
      position: "relative",
      marginBottom: 16,
    },

    passwordInput: {
      width: "100%",
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      paddingRight: 45,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },

    eyeButton: {
      position: "absolute",
      right: 10,
      top: 0,
      bottom: 0,
      width: 34,
      alignItems: "center",
      justifyContent: "center",
    },

    forgotPasswordRow: {
      width: "100%",
      alignItems: "flex-end",
      marginTop: -8,
    },

    forgotPasswordText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },

    rememberRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
    },

    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 5,
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

    rememberText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },

    loginButton: {
      width: "100%",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      minHeight: 48,
    },

    loginButtonDisabled: {
      opacity: 0.7,
    },

    loginButtonText: {
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

    signupRow: {
      flexDirection: "row",
      marginTop: 18,
    },

    signupText: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },

    signupLink: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });
