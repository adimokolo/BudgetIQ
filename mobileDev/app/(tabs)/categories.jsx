import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../../services/categories";

import { useTheme } from "../../contexts/ThemeContext";

// FONTS
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

// Background color for each category's icon circle. Kept alongside
// the icon (rather than replaced) since a colored circle is what
// makes each icon glyph easy to tell apart at a glance.
const SWATCHES = [
  "#174E78",
  "#2DD4BF",
  "#7C6FF0",
  "#F472B6",
  "#EC4899",
  "#FBBF24",
  "#16A34A",
  "#F59E0B",
  "#3B82F6",
  "#EF4444",
  "#0EA5E9",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#84CC16",
];

// Pool of icon choices shown in the "New category" picker. Ionicons
// ships with Expo already, so nothing extra to install.
const ICON_OPTIONS = [
  "fast-food-outline",
  "restaurant-outline",
  "cafe-outline",
  "beer-outline",
  "cart-outline",
  "basket-outline",
  "bus-outline",
  "car-outline",
  "bicycle-outline",
  "train-outline",
  "airplane-outline",
  "home-outline",
  "bed-outline",
  "flash-outline",
  "water-outline",
  "wifi-outline",
  "call-outline",
  "phone-portrait-outline",
  "laptop-outline",
  "medkit-outline",
  "fitness-outline",
  "barbell-outline",
  "school-outline",
  "book-outline",
  "film-outline",
  "musical-notes-outline",
  "game-controller-outline",
  "gift-outline",
  "shirt-outline",
  "cut-outline",
  "paw-outline",
  "diamond-outline",
  "wallet-outline",
  "card-outline",
  "cash-outline",
  "trending-up-outline",
  "briefcase-outline",
  "business-outline",
  "construct-outline",
  "heart-outline",
  "ellipsis-horizontal-outline",
];

// Expanded preset list so the picker starts with a much longer
// default set of categories than just "type a name + pick a color".
// Tapping one fills the form (name/type/icon/color); the person can
// still tweak it before saving, or type something custom instead.
const CATEGORY_PRESETS = [
  {
    name: "Food & Dining",
    type: "Expense",
    icon: "fast-food-outline",
    color: "#F59E0B",
  },
  {
    name: "Groceries",
    type: "Expense",
    icon: "basket-outline",
    color: "#22C55E",
  },
  { name: "Transport", type: "Expense", icon: "bus-outline", color: "#3B82F6" },
  { name: "Fuel", type: "Expense", icon: "car-outline", color: "#0EA5E9" },
  { name: "Rent", type: "Expense", icon: "home-outline", color: "#174E78" },
  {
    name: "Utilities",
    type: "Expense",
    icon: "flash-outline",
    color: "#EF4444",
  },
  {
    name: "Internet & Airtime",
    type: "Expense",
    icon: "wifi-outline",
    color: "#A855F7",
  },
  { name: "Shopping", type: "Expense", icon: "cart-outline", color: "#EC4899" },
  {
    name: "Subscriptions",
    type: "Expense",
    icon: "card-outline",
    color: "#7C6FF0",
  },
  {
    name: "Entertainment",
    type: "Expense",
    icon: "film-outline",
    color: "#7C6FF0",
  },
  { name: "Health", type: "Expense", icon: "medkit-outline", color: "#16A34A" },
  {
    name: "Fitness",
    type: "Expense",
    icon: "barbell-outline",
    color: "#F97316",
  },
  {
    name: "Education",
    type: "Expense",
    icon: "school-outline",
    color: "#3B82F6",
  },
  {
    name: "Travel",
    type: "Expense",
    icon: "airplane-outline",
    color: "#2DD4BF",
  },
  {
    name: "Personal Care",
    type: "Expense",
    icon: "cut-outline",
    color: "#F472B6",
  },
  { name: "Pets", type: "Expense", icon: "paw-outline", color: "#84CC16" },
  {
    name: "Gifts & Donations",
    type: "Expense",
    icon: "gift-outline",
    color: "#EC4899",
  },
  {
    name: "Repairs",
    type: "Expense",
    icon: "construct-outline",
    color: "#F59E0B",
  },
  { name: "Salary", type: "Income", icon: "cash-outline", color: "#16A34A" },
  {
    name: "Freelance",
    type: "Income",
    icon: "briefcase-outline",
    color: "#2DD4BF",
  },
  {
    name: "Business",
    type: "Income",
    icon: "business-outline",
    color: "#174E78",
  },
  {
    name: "Investment",
    type: "Income",
    icon: "trending-up-outline",
    color: "#22C55E",
  },
  { name: "Gift", type: "Income", icon: "gift-outline", color: "#F472B6" },
  {
    name: "Other Income",
    type: "Income",
    icon: "wallet-outline",
    color: "#FBBF24",
  },
];

// Fallback icon whenever a category was created before icons existed
// (or the icon field otherwise comes back empty from the API).
function fallbackIconFor(type) {
  return type?.toLowerCase() === "income" ? "cash-outline" : "pricetag-outline";
}

function CategoryRow({ category, onDelete, colors }) {
  return (
    <View
      style={[
        styles.categoryRow,
        {
          borderTopColor: colors.divider,
        },
      ]}
    >
      <View style={styles.categoryLeft}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: category.color || colors.primary,
            },
          ]}
        >
          <Ionicons
            name={category.icon || fallbackIconFor(category.type)}
            size={16}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={[
            styles.categoryName,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {category.name}
        </Text>
      </View>

      <Pressable
        onPress={() => onDelete(category.id)}
        hitSlop={8}
        style={[
          styles.deleteButton,
          {
            backgroundColor: colors.divider,
          },
        ]}
      >
        <Text
          style={[
            styles.deleteButtonText,
            {
              color: colors.textFaint,
            },
          ]}
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
}

function CategorySection({ title, categories, onDelete, colors }) {
  const count = categories.length;

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.sectionSubtitle,
          {
            color: colors.textFaint,
          },
        ]}
      >
        {count} {count === 1 ? "category" : "categories"}
      </Text>

      {categories.length > 0 ? (
        <View style={styles.categoryList}>
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onDelete={onDelete}
              colors={colors}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.textFaint,
              },
            ]}
          >
            No categories yet.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function Categories() {
  const { colors } = useTheme();

  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("Expense");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(SWATCHES[0]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,

    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,

    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      loadCategories();
    }
  }, [fontsLoaded]);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const data = await getCategories();

      console.log("Categories from API:", data);

      const categories = Array.isArray(data) ? data : data?.categories || [];

      const income = categories.filter(
        (category) => category.type?.toLowerCase() === "income",
      );

      const expense = categories.filter(
        (category) => category.type?.toLowerCase() === "expense",
      );

      setIncomeCategories(income);
      setExpenseCategories(expense);
    } catch (error) {
      console.log("Category loading error:", error);

      Alert.alert(
        "Error",
        error.message ||
          "Unable to load categories. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      setRefreshing(true);

      const data = await getCategories();

      const categories = Array.isArray(data) ? data : data?.categories || [];

      const income = categories.filter(
        (category) => category.type?.toLowerCase() === "income",
      );

      const expense = categories.filter(
        (category) => category.type?.toLowerCase() === "expense",
      );

      setIncomeCategories(income);
      setExpenseCategories(expense);
    } catch (error) {
      console.log("Refresh error:", error);

      Alert.alert("Error", error.message || "Unable to refresh categories.");
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setName("");
    setType("Expense");
    setIcon(ICON_OPTIONS[0]);
    setColor(SWATCHES[0]);
  };

  const applyPreset = (preset) => {
    setName(preset.name);
    setType(preset.type);
    setIcon(preset.icon);
    setColor(preset.color);
  };

  const addCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Missing information", "Please enter a category name.");
      return;
    }

    try {
      const newCategory = {
        name: name.trim(),
        type: type.toLowerCase(),
        icon: icon,
        color: color,
      };

      console.log("Sending category:", newCategory);

      await createCategory(newCategory);

      Alert.alert("Success", "Category added successfully.");

      resetForm();
      setShowAddModal(false);

      await loadCategories();
    } catch (error) {
      console.log("Add category error:", error);

      Alert.alert("Error", error.message || "Unable to add category.");
    }
  };

  const handleDeleteCategory = (id) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              await deleteCategory(id);

              Alert.alert("Success", "Category deleted successfully.");

              await loadCategories();
            } catch (error) {
              console.log("Delete category error:", error);

              Alert.alert(
                "Error",
                error.message || "Unable to delete category.",
              );
            }
          },
        },
      ],
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Loading categories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCategories}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
            >
              Categories
            </Text>

            <Text
              style={[
                styles.subheading,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Organize income and spending so patterns are easy to spot.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: colors.primaryText,
                },
              ]}
            >
              + New category
            </Text>
          </TouchableOpacity>
        </View>

        {/* INCOME */}

        <CategorySection
          title="Income"
          categories={incomeCategories}
          onDelete={handleDeleteCategory}
          colors={colors}
        />

        {/* EXPENSE */}

        <CategorySection
          title="Expense"
          categories={expenseCategories}
          onDelete={handleDeleteCategory}
          colors={colors}
        />
      </ScrollView>

      {/* ADD CATEGORY MODAL */}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: colors.overlay,
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* MODAL HEADER */}

              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  New category
                </Text>

                <Pressable
                  onPress={() => {
                    resetForm();
                    setShowAddModal(false);
                  }}
                  hitSlop={8}
                >
                  <Text
                    style={[
                      styles.closeButton,
                      {
                        color: colors.textFaint,
                      },
                    ]}
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              {/* QUICK ADD PRESETS */}

              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: colors.textMuted,
                    marginTop: 0,
                  },
                ]}
              >
                Quick add
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetRow}
              >
                {CATEGORY_PRESETS.map((preset) => {
                  const isActive =
                    preset.name === name &&
                    preset.icon === icon &&
                    preset.color === color;

                  return (
                    <Pressable
                      key={preset.name}
                      onPress={() => applyPreset(preset)}
                      style={[
                        styles.presetChip,
                        {
                          borderColor: colors.inputBorder,
                          backgroundColor: colors.inputBg,
                        },
                        isActive && {
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.presetChipIcon,
                          {
                            backgroundColor: preset.color,
                          },
                        ]}
                      >
                        <Ionicons
                          name={preset.icon}
                          size={13}
                          color="#FFFFFF"
                        />
                      </View>

                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: colors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {preset.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* CATEGORY NAME */}

              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Category name
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Subscriptions"
                placeholderTextColor={colors.textFaint}
                value={name}
                onChangeText={setName}
              />

              {/* CATEGORY TYPE */}

              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Category type
              </Text>

              <View style={styles.typeButtons}>
                <Pressable
                  style={[
                    styles.typeButton,
                    {
                      borderColor: colors.inputBorder,
                    },

                    type === "Income" && {
                      backgroundColor: colors.incomeBg,
                      borderColor: colors.income,
                    },
                  ]}
                  onPress={() => setType("Income")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color: colors.textMuted,
                      },

                      type === "Income" && {
                        color: colors.income,
                      },
                    ]}
                  >
                    Income
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    {
                      borderColor: colors.inputBorder,
                    },

                    type === "Expense" && {
                      backgroundColor: colors.expenseBg,
                      borderColor: colors.expense,
                    },
                  ]}
                  onPress={() => setType("Expense")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color: colors.textMuted,
                      },

                      type === "Expense" && {
                        color: colors.expense,
                      },
                    ]}
                  >
                    Expense
                  </Text>
                </Pressable>
              </View>

              {/* ICON */}

              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Icon
              </Text>

              <View
                style={[
                  styles.iconPreviewRow,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBg,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    styles.iconPreviewCircle,
                    {
                      backgroundColor: color,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={18} color="#FFFFFF" />
                </View>

                <Text
                  style={[
                    styles.iconPreviewText,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  This is how {name.trim() || "the category"} will look
                </Text>
              </View>

              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((iconName) => (
                  <Pressable
                    key={iconName}
                    onPress={() => setIcon(iconName)}
                    style={[
                      styles.iconOption,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBg,
                      },

                      icon === iconName && {
                        borderColor: colors.primary,
                        backgroundColor: colors.incomeBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={17}
                      color={
                        icon === iconName ? colors.primary : colors.textMuted
                      }
                    />
                  </Pressable>
                ))}
              </View>

              {/* COLOR */}

              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Color
              </Text>

              <View style={styles.swatchRow}>
                {SWATCHES.map((swatch) => (
                  <Pressable
                    key={swatch}
                    onPress={() => setColor(swatch)}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: swatch,
                      },

                      color === swatch && {
                        borderColor: colors.text,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* SAVE */}

              <Pressable
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={addCategory}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: colors.primaryText,
                    },
                  ]}
                >
                  Add category
                </Text>
              </Pressable>
            </ScrollView>
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

  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
  },
  heading: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  subheading: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 15,
  },
  addButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  addButtonText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  sectionSubtitle: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: 12,
  },

  categoryList: {
    marginTop: 4,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
  },

  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Icon replaces the old plain color "dot" indicator - a small
  // circle in the category's color, with the chosen Ionicons glyph
  // centered inside it (white, so it reads on any swatch color).
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: "Inter_700Bold",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    borderRadius: 16,
    padding: 20,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  closeButton: {
    fontSize: 17,
    lineHeight: 18,
    fontFamily: "Inter_700Bold",
  },

  inputLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // QUICK ADD PRESETS

  presetRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingRight: 6,
  },

  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },

  presetChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  presetChipText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 90,
  },

  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  typeButtonText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  // ICON PICKER

  iconPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  iconPreviewCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  iconPreviewText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // COLOR SWATCHES

  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },

  saveButton: {
    marginTop: 20,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
