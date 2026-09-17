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
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../../services/categories";
import { useTheme } from "../../contexts/ThemeContext";
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

const SWATCHES = [
  "#F59E0B",
  "#22C55E",
  "#3B82F6",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#2DD4BF",
  "#F97316",
  "#0EA5E9",
  "#84CC16",
  "#FBBF24",
  "#7C6FF0",
  "#174E78",
  "#16A34A",
  "#F472B6",
];
const EMOJI_OPTIONS = [
  "🍔",
  "🍽️",
  "☕",
  "🍺",
  "🛒",
  "🧺",
  "🚌",
  "🚗",
  "🚲",
  "🚂",
  "✈️",
  "🏠",
  "🛏️",
  "⚡",
  "💧",
  "📶",
  "📞",
  "📱",
  "💻",
  "🏥",
  "🏃",
  "🏋️",
  "🏫",
  "📚",
  "🎬",
  "🎵",
  "🎮",
  "🎁",
  "👕",
  "✂️",
  "🐾",
  "💎",
  "👛",
  "💳",
  "💵",
  "📈",
  "💼",
  "🏢",
  "🛠️",
  "❤️",
];

const ICON_MAP = {
  "fast-food-outline": "🍔",
  "restaurant-outline": "🍽️",
  "cafe-outline": "☕",
  "beer-outline": "🍺",
  "cart-outline": "🛒",
  "basket-outline": "🧺",
  "bus-outline": "🚌",
  "car-outline": "🚗",
  "bicycle-outline": "🚲",
  "train-outline": "🚆",
  "airplane-outline": "✈️",
  "home-outline": "🏠",
  "bed-outline": "🛏️",
  "flash-outline": "⚡",
  "water-outline": "💧",
  "wifi-outline": "📶",
  "call-outline": "📞",
  "phone-portrait-outline": "📱",
  "laptop-outline": "💻",
  "medkit-outline": "🩺",
  "fitness-outline": "🏃",
  "barbell-outline": "🏋️",
  "school-outline": "🎓",
  "book-outline": "📚",
  "film-outline": "🎬",
  "musical-notes-outline": "🎵",
  "game-controller-outline": "🎮",
  "gift-outline": "🎁",
  "shirt-outline": "👕",
  "cut-outline": "✂️",
  "paw-outline": "🐾",
  "diamond-outline": "💎",
  "wallet-outline": "👛",
  "card-outline": "💳",
  "cash-outline": "💵",
  "trending-up-outline": "📈",
  "briefcase-outline": "💼",
  "business-outline": "🏢",
  "construct-outline": "🛠️",
  "heart-outline": "❤️",
  "ellipsis-horizontal-outline": "•••",
  "pricetag-outline": "🏷️",
};

const ICON_OPTIONS = Object.keys(ICON_MAP).filter(
  (iconName) => iconName !== "pricetag-outline",
);

function getIcon(iconName) {
  if (!iconName) return ICON_MAP["pricetag-outline"];

  if (EMOJI_OPTIONS.includes(iconName)) return iconName;

  const normalizedName = iconName.endsWith("-outline")
    ? iconName
    : `${iconName}-outline`;

  return (
    ICON_MAP[iconName] ||
    ICON_MAP[normalizedName] ||
    ICON_MAP["pricetag-outline"]
  );
}

const CATEGORY_PRESETS = [
  {
    name: "Food & Dining",
    type: "expense",
    icon: "fast-food-outline",
    color: "#F59E0B",
  },
  {
    name: "Groceries",
    type: "expense",
    icon: "basket-outline",
    color: "#22C55E",
  },
  { name: "Transport", type: "expense", icon: "bus-outline", color: "#3B82F6" },
  { name: "Fuel", type: "expense", icon: "car-outline", color: "#0EA5E9" },
  { name: "Rent", type: "expense", icon: "home-outline", color: "#174E78" },
  {
    name: "Utilities",
    type: "expense",
    icon: "flash-outline",
    color: "#EF4444",
  },
  {
    name: "Internet & Airtime",
    type: "expense",
    icon: "wifi-outline",
    color: "#A855F7",
  },
  { name: "Shopping", type: "expense", icon: "cart-outline", color: "#EC4899" },
  {
    name: "Subscriptions",
    type: "expense",
    icon: "card-outline",
    color: "#7C6FF0",
  },
  {
    name: "Entertainment",
    type: "expense",
    icon: "film-outline",
    color: "#7C6FF0",
  },
  { name: "Health", type: "expense", icon: "medkit-outline", color: "#16A34A" },
  {
    name: "Fitness",
    type: "expense",
    icon: "barbell-outline",
    color: "#F97316",
  },
  {
    name: "Education",
    type: "expense",
    icon: "school-outline",
    color: "#3B82F6",
  },
  {
    name: "Travel",
    type: "expense",
    icon: "airplane-outline",
    color: "#2DD4BF",
  },
  {
    name: "Personal Care",
    type: "expense",
    icon: "cut-outline",
    color: "#F472B6",
  },
  { name: "Pets", type: "expense", icon: "paw-outline", color: "#84CC16" },
  {
    name: "Gifts & Donations",
    type: "expense",
    icon: "gift-outline",
    color: "#EC4899",
  },
  {
    name: "Repairs",
    type: "expense",
    icon: "construct-outline",
    color: "#F59E0B",
  },
  { name: "Salary", type: "income", icon: "cash-outline", color: "#16A34A" },
  {
    name: "Freelance",
    type: "income",
    icon: "briefcase-outline",
    color: "#2DD4BF",
  },
  {
    name: "Business",
    type: "income",
    icon: "business-outline",
    color: "#174E78",
  },
  {
    name: "Investment",
    type: "income",
    icon: "trending-up-outline",
    color: "#22C55E",
  },
  { name: "Gift", type: "income", icon: "gift-outline", color: "#F472B6" },
  {
    name: "Other Income",
    type: "income",
    icon: "wallet-outline",
    color: "#FBBF24",
  },
];

function fallbackIconFor(type) {
  return type?.toLowerCase() === "income" ? "cash-outline" : "pricetag-outline";
}

function CategoryRow({ category, onDelete, colors }) {
  return (
    <View style={[styles.categoryRow, { borderTopColor: colors.divider }]}>
      <View style={styles.categoryLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: category.color || colors.primary },
          ]}
        >
          <Text style={styles.categoryIcon}>
            {getIcon(category.icon || fallbackIconFor(category.type))}
          </Text>
        </View>

        <Text style={[styles.categoryName, { color: colors.textMuted }]}>
          {category.name}
        </Text>
      </View>

      <Pressable
        onPress={() => onDelete(category.id)}
        hitSlop={8}
        style={[styles.deleteButton, { backgroundColor: colors.divider }]}
      >
        <Text style={[styles.deleteButtonText, { color: colors.textFaint }]}>
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
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.sectionSubtitle, { color: colors.textFaint }]}>
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
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>
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
  const [modalTab, setModalTab] = useState("quick");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("Expense");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
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

  const allCategories = [...incomeCategories, ...expenseCategories];

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
    setModalTab("quick");
    setTypeMenuOpen(false);
  };

  const existingNames = new Set(
    [...incomeCategories, ...expenseCategories].map((category) =>
      category.name.toLowerCase(),
    ),
  );

  const addPreset = async (preset) => {
    if (existingNames.has(preset.name.toLowerCase()) || saving) return;

    try {
      setSaving(true);
      await createCategory({
        name: preset.name,
        type: preset.type.toLowerCase(),
        icon: preset.icon,
        color: preset.color,
      });
      const data = await getCategories();
      const categories = Array.isArray(data) ? data : data?.categories || [];
      setIncomeCategories(
        categories.filter(
          (category) => category.type?.toLowerCase() === "income",
        ),
      );
      setExpenseCategories(
        categories.filter(
          (category) => category.type?.toLowerCase() === "expense",
        ),
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Unable to add category.");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Missing information", "Please enter a category name.");
      return;
    }

    try {
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (id) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
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
        style={[styles.screen, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading categories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
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
        <View style={styles.header}>
          <View>
            <Text style={[styles.heading, { color: colors.text }]}>
              Categories
            </Text>
            <Text style={[styles.subheading, { color: colors.textMuted }]}>
              Organize income and spending so patterns are easy to spot.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonText, { color: colors.primaryText }]}>
              + New category
            </Text>
          </TouchableOpacity>
        </View>

        <CategorySection
          title="Income"
          categories={incomeCategories}
          onDelete={handleDeleteCategory}
          colors={colors}
        />

        <CategorySection
          title="Expense"
          categories={expenseCategories}
          onDelete={handleDeleteCategory}
          colors={colors}
        />
      </ScrollView>

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
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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

              <View style={styles.tabRow}>
                <Pressable
                  onPress={() => setModalTab("quick")}
                  style={[
                    styles.tabButton,
                    { backgroundColor: colors.inputBg },
                    modalTab === "quick" && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      { color: colors.text },
                      modalTab === "quick" && { color: colors.primaryText },
                    ]}
                  >
                    ⚡ Quick add
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setModalTab("custom")}
                  style={[
                    styles.tabButton,
                    { backgroundColor: colors.inputBg },
                    modalTab === "custom" && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      { color: colors.text },
                      modalTab === "custom" && { color: colors.primaryText },
                    ]}
                  >
                    ✏️ Custom
                  </Text>
                </Pressable>
              </View>

              {modalTab === "quick" ? (
                <View style={styles.quickAddContent}>
                  {["Expense", "Income"].map((presetType) => (
                    <View key={presetType} style={styles.presetSection}>
                      <Text
                        style={[
                          styles.presetSectionTitle,
                          { color: colors.textFaint },
                        ]}
                      >
                        {presetType.toUpperCase()}
                      </Text>

                      <View style={styles.presetGrid}>
                        {CATEGORY_PRESETS.filter(
                          (preset) => preset.type === presetType.toLowerCase(),
                        ).map((preset) => {
                          const isAdded = existingNames.has(
                            preset.name.toLowerCase(),
                          );

                          return (
                            <Pressable
                              key={preset.name}
                              disabled={isAdded || saving}
                              onPress={() => addPreset(preset)}
                              style={[
                                styles.presetCard,
                                {
                                  borderColor: colors.inputBorder,
                                  backgroundColor: colors.inputBg,
                                },
                                isAdded && styles.presetCardAdded,
                              ]}
                            >
                              <View
                                style={[
                                  styles.presetCardIcon,
                                  { backgroundColor: preset.color },
                                  isAdded && styles.presetCardIconAdded,
                                ]}
                              >
                                <Text style={styles.presetCardEmoji}>
                                  {getIcon(preset.icon)}
                                </Text>
                              </View>

                              <View style={styles.presetCardTextWrap}>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.presetCardName,
                                    { color: colors.text },
                                    isAdded && { color: colors.textFaint },
                                  ]}
                                >
                                  {preset.name}
                                </Text>
                                {isAdded && (
                                  <Text
                                    style={[
                                      styles.addedText,
                                      { color: colors.textFaint },
                                    ]}
                                  >
                                    Added
                                  </Text>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  <Text
                    style={[
                      styles.inputLabel,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Name
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="e.g. Data & Airtime"
                    placeholderTextColor={colors.textFaint}
                    value={name}
                    onChangeText={setName}
                  />

                  <Text
                    style={[
                      styles.inputLabel,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Type
                  </Text>

                  <Pressable
                    onPress={() => setTypeMenuOpen((open) => !open)}
                    style={[
                      styles.typeSelect,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBg,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.typeSelectText, { color: colors.text }]}
                    >
                      {type}
                    </Text>
                    <Text
                      style={[
                        styles.typeSelectArrow,
                        { color: colors.textFaint },
                      ]}
                    >
                      ⌄
                    </Text>
                  </Pressable>

                  {typeMenuOpen && (
                    <View
                      style={[
                        styles.typeMenu,
                        {
                          borderColor: colors.inputBorder,
                          backgroundColor: colors.card,
                        },
                      ]}
                    >
                      {["Expense", "Income"].map((option) => (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setType(option);
                            setTypeMenuOpen(false);
                          }}
                          style={styles.typeMenuOption}
                        >
                          <Text
                            style={[
                              styles.typeMenuOptionText,
                              { color: colors.text },
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

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

                  <ScrollView
                    style={[
                      styles.iconGrid,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBg,
                      },
                    ]}
                    contentContainerStyle={styles.iconGridContent}
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                  >
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
                        <Text style={styles.optionIconText}>
                          {getIcon(iconName)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

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
                        { backgroundColor: color },
                      ]}
                    >
                      <Text style={styles.previewIconText}>
                        {getIcon(icon)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.iconPreviewText, { color: colors.text }]}
                    >
                      {name.trim() || "Category preview"}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={addCategory}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.saveButtonText,
                        {
                          color: colors.primaryText,
                        },
                      ]}
                    >
                      {saving ? "Saving..." : "Save category"}
                    </Text>
                  </Pressable>
                </View>
              )}
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
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryIcon: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
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
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  closeButton: {
    fontSize: 20,
    lineHeight: 32,
    fontFamily: "Inter_400Regular",
  },

  tabRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  tabButton: {
    flex: 1,
    minHeight: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  tabButtonText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },

  quickAddContent: {
    paddingBottom: 4,
  },

  presetSection: {
    marginBottom: 18,
  },

  presetSectionTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    marginBottom: 10,
  },

  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  presetCard: {
    width: "48.7%",
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 10,
  },

  presetCardAdded: {
    opacity: 0.52,
  },

  presetCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  presetCardIconAdded: {
    opacity: 0.75,
  },

  presetCardEmoji: {
    fontSize: 12,
    lineHeight: 25,
    textAlign: "center",
  },

  presetCardTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  presetCardName: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  addedText: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },

  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },

  presetChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  presetIconText: {
    fontSize: 10,
    lineHeight: 18,
    textAlign: "center",
  },

  presetChipText: {
    fontSize: 8,
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
    paddingVertical: 9,
    alignItems: "center",
  },

  typeButtonText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },

  typeSelect: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  typeSelectText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  typeSelectArrow: {
    fontSize: 17,
  },

  typeMenu: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
  },

  typeMenuOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  typeMenuOptionText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  iconPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 18,
  },

  iconPreviewCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  previewIconText: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },

  iconPreviewText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },

  iconGrid: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 170,
    overflow: "hidden",
  },

  iconGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    padding: 10,
  },

  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  optionIconText: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },

  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  swatch: {
    width: 25,
    height: 24,
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
