import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Linking,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import { getCurrentUser, logoutUser, uploadAvatar } from "../services/auth";

import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";

import { ALL_CURRENCIES, currencyLabel } from "../utils/currency";

// TODO: point this at your real support inbox.
const SUPPORT_EMAIL = "support@yourapp.com";

const FAQ_ITEMS = [
  {
    question: "How do I change my base currency?",
    answer:
      "Go to Profile, tap 'Base currency' and pick the currency you want. All totals and summaries will use this currency going forward.",
  },
  {
    question: "Can I use the app offline?",
    answer:
      "Yes, you can keep tracking while offline. Anything you add will sync automatically the next time you're connected.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "From Profile, tap 'Change password' and follow the steps to set a new one.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "From Profile, scroll to the bottom and tap 'Delete account'. This permanently removes your data and can't be undone.",
  },
];

export default function Profile() {
  const router = useRouter();

  const { colors, isDark, setDarkMode } = useTheme();
  const { baseCurrency, setBaseCurrency } = useCurrency();

  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar_url: null,
  });

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

  const [contactModalVisible, setContactModalVisible] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const data = await getCurrentUser();

      console.log("CURRENT USER RESPONSE:", JSON.stringify(data, null, 2));

      const profile = data?.user || data?.data?.user || data?.data || data;

      console.log("USER PROFILE:", JSON.stringify(profile, null, 2));

      setUser({
        name:
          profile?.full_name ||
          profile?.name ||
          profile?.fullName ||
          profile?.username ||
          "User",

        email: profile?.email || "",

        avatar_url:
          profile?.avatar_url ||
          profile?.avatarUrl ||
          profile?.profile_image ||
          profile?.profileImage ||
          profile?.image ||
          profile?.photo ||
          null,
      });

      // If the profile response already carries a base currency, prefer
      // that over whatever is cached locally. setBaseCurrency() updates
      // the shared context (and its AsyncStorage cache) for every screen.
      const remoteCurrency =
        profile?.base_currency || profile?.baseCurrency || null;

      if (remoteCurrency && remoteCurrency !== baseCurrency) {
        setBaseCurrency(remoteCurrency);
      }
    } catch (error) {
      console.log(
        "LOAD PROFILE ERROR:",
        error?.response?.data || error?.message || error,
      );

      Alert.alert(
        "Unable to load profile",
        error?.message ||
          error?.error ||
          "We couldn't load your profile information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const handleAvatarPress = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your photo library to upload a profile picture.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      const mimeType = asset.mimeType || "image/jpeg";

      const avatarDataUrl = `data:${mimeType};base64,${asset.base64}`;

      setUploading(true);

      const response = await uploadAvatar(avatarDataUrl);

      console.log("AVATAR UPLOAD RESPONSE:", response);

      const updatedUser = response.user;

      setUser((currentUser) => ({
        ...currentUser,
        avatar_url: updatedUser.avatar_url,
      }));

      Alert.alert("Success", "Your profile picture has been updated.");
    } catch (error) {
      console.log("Avatar error:", error);

      Alert.alert(
        "Upload Failed",
        error?.message ||
          error?.error ||
          "Unable to upload your profile picture. Try choosing a smaller image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/forget-password");
  };

  const handleSelectCurrency = async (code) => {
    // Updates the shared CurrencyContext (and its AsyncStorage cache),
    // so every screen using useCurrency() picks up the change instantly.
    await setBaseCurrency(code);
    setCurrencyModalVisible(false);
  };

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      Alert.alert("Pick a rating", "Tap a star to rate your experience.");
      return;
    }

    console.log("USER RATING SUBMITTED:", selectedRating);

    // TODO: send `selectedRating` to your analytics/feedback endpoint here.

    setRatingSubmitted(true);
  };

  const closeRateModal = () => {
    setRateModalVisible(false);
    setSelectedRating(0);
    setRatingSubmitted(false);
  };

  const handleContactEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
      Alert.alert(
        "Unable to open mail app",
        `Please email us directly at ${SUPPORT_EMAIL}.`,
      );
    });
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  const performLogout = async () => {
    try {
      setLoggingOut(true);

      await logoutUser();

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);

      Alert.alert("Logout failed", "Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and all of your data. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    // A second confirmation for a destructive, irreversible action.
    Alert.alert(
      "Are you absolutely sure?",
      "Type nothing needed — just confirm one more time to permanently delete your account.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, delete my account",
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ],
    );
  };

  const performDeleteAccount = async () => {
    try {
      setDeleting(true);

      // TODO: wire this up to your real delete-account endpoint, e.g.:
      // await deleteAccount();
      // For now this only logs the user out locally so the UI has
      // somewhere safe to go once the real call is in place.
      await logoutUser();

      router.replace("/");
    } catch (error) {
      console.log("Delete account error:", error);

      Alert.alert(
        "Unable to delete account",
        error?.message ||
          error?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const avatarSource = user.avatar_url ? { uri: user.avatar_url } : null;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top"]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Profile
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={() => (
          <>
            {/* PROFILE */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                disabled={loading || uploading}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.avatarRing,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    {uploading ? (
                      <ActivityIndicator size="large" color={colors.primary} />
                    ) : loading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.textFaint}
                      />
                    ) : avatarSource ? (
                      <Image
                        source={avatarSource}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="person"
                        size={56}
                        color={colors.textFaint}
                      />
                    )}
                  </View>

                  <View
                    style={[
                      styles.cameraButton,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.card,
                      },
                    ]}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>

              {loading ? (
                <>
                  <View
                    style={[
                      styles.nameSkeleton,
                      {
                        backgroundColor: colors.skeleton,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.emailSkeleton,
                      {
                        backgroundColor: colors.skeleton,
                      },
                    ]}
                  />
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.userName,
                      {
                        color: colors.text,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {user.name}
                  </Text>

                  <Text
                    style={[
                      styles.userEmail,
                      {
                        color: colors.textFaint,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                </>
              )}
            </View>

            {/* SETTINGS CARD */}
            <View
              style={[
                styles.listCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* DARK MODE */}
              <View style={styles.listRow}>
                <View style={styles.listLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="moon-outline"
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.listLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Dark mode
                    </Text>

                    <Text
                      style={[
                        styles.listDescription,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Use a darker appearance
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isDark}
                  onValueChange={setDarkMode}
                  trackColor={{
                    false: colors.divider,
                    true: colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.divider,
                  },
                ]}
              />

              {/* BASE CURRENCY */}
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => setCurrencyModalVisible(true)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.listLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Base currency
                    </Text>

                    <Text
                      style={[
                        styles.listDescription,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      {currencyLabel(baseCurrency)}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.divider,
                  },
                ]}
              />

              {/* CHANGE PASSWORD */}
              <TouchableOpacity
                style={styles.listRow}
                onPress={handleChangePassword}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.listLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Change password
                    </Text>

                    <Text
                      style={[
                        styles.listDescription,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Update your account password
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </TouchableOpacity>
            </View>

            {/* SUPPORT CARD */}
            <View
              style={[
                styles.listCard,
                styles.supportCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* RATE US */}
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => setRateModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="star-outline"
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.listLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Rate us
                    </Text>

                    <Text
                      style={[
                        styles.listDescription,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Let us know how we're doing
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.divider,
                  },
                ]}
              />

              {/* FAQ */}
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => setFaqModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.listLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      FAQ
                    </Text>

                    <Text
                      style={[
                        styles.listDescription,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Answers to common questions
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.divider,
                  },
                ]}
              />

              {/* CONTACT US */}
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => setContactModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.listLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Contact us
                    </Text>

                    <Text
                      style={[
                        styles.listDescription,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Get in touch with our team
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </TouchableOpacity>
            </View>

            {/* LOGOUT */}
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.dangerBorder,
                },
                loggingOut && styles.logoutButtonDisabled,
              ]}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.7}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={colors.danger}
                />
              )}

              <Text
                style={[
                  styles.logoutText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </Text>
            </TouchableOpacity>

            {/* DELETE ACCOUNT */}
            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  borderColor: colors.dangerBorder,
                },
                deleting && styles.logoutButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={deleting}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              )}

              <Text
                style={[
                  styles.logoutText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                {deleting ? "Deleting..." : "Delete account"}
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.deleteWarning,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Deleting your account permanently removes all of your data,
              including your profile, history, and settings. This can't be
              undone.
            </Text>
          </>
        )}
      />

      {/* BASE CURRENCY MODAL */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              styles.modalSheetTall,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Base currency
              </Text>

              <TouchableOpacity
                onPress={() => setCurrencyModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.textFaint} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={ALL_CURRENCIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.code === baseCurrency;

                return (
                  <TouchableOpacity
                    style={styles.currencyRow}
                    onPress={() => handleSelectCurrency(item.code)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.currencyRowText,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {item.code} — {item.name}
                    </Text>

                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* RATE US MODAL */}
      <Modal
        visible={rateModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeRateModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              styles.modalSheetCentered,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            {ratingSubmitted ? (
              <>
                <Ionicons
                  name="heart"
                  size={40}
                  color={colors.primary}
                  style={{ marginBottom: 12 }}
                />

                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Thanks for the feedback!
                </Text>

                <Text
                  style={[
                    styles.modalBodyText,
                    { color: colors.textFaint, marginTop: 6 },
                  ]}
                >
                  We really appreciate you taking the time.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.modalPrimaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={closeRateModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalPrimaryButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Enjoying the app?
                </Text>

                <Text
                  style={[
                    styles.modalBodyText,
                    { color: colors.textFaint, marginTop: 6 },
                  ]}
                >
                  Tap a star to rate your experience.
                </Text>

                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <TouchableOpacity
                      key={starValue}
                      onPress={() => setSelectedRating(starValue)}
                      hitSlop={6}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          starValue <= selectedRating ? "star" : "star-outline"
                        }
                        size={36}
                        color={colors.primary}
                        style={styles.starIcon}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalPrimaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSubmitRating}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalPrimaryButtonText}>Submit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeRateModal}
                  style={{ marginTop: 10 }}
                >
                  <Text
                    style={[
                      styles.modalDismissText,
                      { color: colors.textFaint },
                    ]}
                  >
                    Not now
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* FAQ MODAL */}
      <Modal
        visible={faqModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFaqModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              styles.modalSheetTall,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                FAQ
              </Text>

              <TouchableOpacity
                onPress={() => setFaqModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.textFaint} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={FAQ_ITEMS}
              keyExtractor={(_, index) => `faq-${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const isExpanded = expandedFaqIndex === index;

                return (
                  <TouchableOpacity
                    style={[styles.faqItem, { borderColor: colors.cardBorder }]}
                    onPress={() =>
                      setExpandedFaqIndex(isExpanded ? null : index)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text
                        style={[styles.faqQuestion, { color: colors.text }]}
                      >
                        {item.question}
                      </Text>

                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.textFaint}
                      />
                    </View>

                    {isExpanded ? (
                      <Text
                        style={[styles.faqAnswer, { color: colors.textFaint }]}
                      >
                        {item.answer}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* CONTACT US MODAL */}
      <Modal
        visible={contactModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              styles.modalSheetCentered,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={36}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Contact us
            </Text>

            <Text
              style={[
                styles.modalBodyText,
                { color: colors.textFaint, marginTop: 6 },
              ]}
            >
              Have a question or ran into an issue? Reach our team and we'll get
              back to you as soon as we can.
            </Text>

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleContactEmail}
              activeOpacity={0.8}
            >
              <Text style={styles.modalPrimaryButtonText}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setContactModalVisible(false)}
              style={{ marginTop: 10 }}
            >
              <Text
                style={[styles.modalDismissText, { color: colors.textFaint }]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  headerTitle: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 28,
  },

  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  cameraButton: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },

  userName: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  userEmail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  nameSkeleton: {
    width: 120,
    height: 22,
    borderRadius: 6,
  },

  emailSkeleton: {
    width: 160,
    height: 14,
    borderRadius: 5,
    marginTop: 8,
  },

  listCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  supportCard: {
    marginTop: 16,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  listLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  listDescription: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },

  divider: {
    height: 1,
    marginLeft: 62,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },

  logoutButtonDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,

    borderRadius: 12,
    backgroundColor: "transparent",
  },

  deleteWarning: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginHorizontal: 32,
    marginTop: 10,
    lineHeight: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },

  modalSheetTall: {
    height: "70%",
  },

  modalSheetCentered: {
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: "auto",
    marginTop: "auto",
    alignItems: "center",
    paddingVertical: 28,
  },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 17,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },

  modalBodyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },

  modalPrimaryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },

  modalPrimaryButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },

  modalDismissText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  starRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 6,
  },

  starIcon: {
    marginHorizontal: 2,
  },

  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  currencyRowText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
    marginRight: 12,
  },

  faqItem: {
    borderBottomWidth: 1,
    paddingVertical: 14,
  },

  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  faqQuestion: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  faqAnswer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    lineHeight: 17,
  },
});
