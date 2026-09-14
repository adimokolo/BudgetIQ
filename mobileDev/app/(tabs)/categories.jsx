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

// Emoji icon set (used for both the custom-icon grid and preset/preview rendering)
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

const CATEGORY_PRESETS = [
  { name: "Food & Dining", type: "expense", icon: "🍔", color: "#F59E0B" },
  { name: "Groceries", type: "expense", icon: "🧺", color: "#22C55E" },
  { name: "Transport", type: "expense", icon: "🚌", color: "#3B82F6" },
  { name: "Fuel", type: "expense", icon: "⛽", color: "#0EA5E9" },
  { name: "Rent", type: "expense", icon: "🏠", color: "#174E78" },
  { name: "Utilities", type: "expense", icon: "⚡", color: "#EF4444" },
  { name: "Internet & Airtime", type: "expense", icon: "📶", color: "#A855F7" },
  { name: "Shopping", type: "expense", icon: "🛍️", color: "#EC4899" },
  { name: "Subscriptions", type: "expense", icon: "💳", color: "#7C6FF0" },
  { name: "Entertainment", type: "expense", icon: "🎬", color: "#7C6FF0" },
  { name: "Health", type: "expense", icon: "🏥", color: "#16A34A" },
  { name: "Fitness", type: "expense", icon: "🏋️", color: "#F97316" },
  { name: "Education", type: "expense", icon: "🏫", color: "#3B82F6" },
  { name: "Travel", type: "expense", icon: "✈️", color: "#2DD4BF" },
  { name: "Personal Care", type: "expense", icon: "✂️", color: "#F472B6" },
  { name: "Pets", type: "expense", icon: "🐾", color: "#84CC16" },
  { name: "Gifts & Donations", type: "expense", icon: "🎁", color: "#EC4899" },
  { name: "Repairs", type: "expense", icon: "🛠️", color: "#F59E0B" },
  { name: "Salary", type: "income", icon: "💵", color: "#16A34A" },
  { name: "Freelance", type: "income", icon: "💼", color: "#2DD4BF" },
  { name: "Business", type: "income", icon: "🏢", color: "#174E78" },
  { name: "Investment", type: "income", icon: "📈", color: "#22C55E" },
  { name: "Gift", type: "income", icon: "🎁", color: "#F472B6" },
  { name: "Other Income", type: "income", icon: "👛", color: "#FBBF24" },
];

function fallbackIconFor(type) {
  return type?.toLowerCase() === "income" ? "💵" : "🏷️";
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
          <Text style={styles.iconGlyph}>
            {category.icon || fallbackIconFor(category.type)}
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
  const [activeTab, setActiveTab] = useState("quick"); // "quick" | "custom"
  const [addingPresetName, setAddingPresetName] = useState(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("Expense");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]);
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
    setIcon(EMOJI_OPTIONS[0]);
    setColor(SWATCHES[0]);
    setActiveTab("quick");
    setTypeDropdownOpen(false);
  };

  const isPresetAdded = (preset) =>
    allCategories.some(
      (category) =>
        category.name?.trim().toLowerCase() === preset.name.toLowerCase(),
    );

  const addCategoryFromPreset = async (preset) => {
    if (isPresetAdded(preset) || addingPresetName) return;

    try {
      setAddingPresetName(preset.name);

      await createCategory({
        name: preset.name,
        type: preset.type,
        icon: preset.icon,
        color: preset.color,
      });

      await loadCategories();
    } catch (error) {
      console.log("Add preset error:", error);

      Alert.alert("Error", error.message || "Unable to add category.");
    } finally {
      setAddingPresetName(null);
    }
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
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New category
              </Text>

              <Pressable
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                hitSlop={8}
              >
                <Text style={[styles.closeButton, { color: colors.textFaint }]}>
                  ×
                </Text>
              </Pressable>
            </View>

            {/* Tab switcher */}
            <View style={styles.tabRow}>
              <Pressable
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                  activeTab === "quick" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveTab("quick")}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: colors.text },
                    activeTab === "quick" && { color: colors.primaryText },
                  ]}
                >
                  ⚡ Quick add
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                  activeTab === "custom" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveTab("custom")}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: colors.text },
                    activeTab === "custom" && { color: colors.primaryText },
                  ]}
                >
                  ✏️ Custom
                </Text>
              </Pressable>
            </View>

            {activeTab === "quick" ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.quickAddScroll}
              >
                <View style={styles.presetGrid}>
                  {CATEGORY_PRESETS.map((preset) => {
                    const added = isPresetAdded(preset);
                    const isSaving = addingPresetName === preset.name;

                    return (
                      <Pressable
                        key={preset.name}
                        onPress={() => addCategoryFromPreset(preset)}
                        disabled={added || isSaving}
                        style={[
                          styles.presetCard,
                          {
                            borderColor: colors.inputBorder,
                            backgroundColor: colors.inputBg,
                          },
                          added && { opacity: 0.6 },
                        ]}
                      >
                        <View
                          style={[
                            styles.iconCircle,
                            { backgroundColor: preset.color },
                          ]}
                        >
                          <Text style={styles.iconGlyph}>{preset.icon}</Text>
                        </View>

                        <View style={styles.presetCardText}>
                          <Text
                            style={[
                              styles.presetCardName,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {preset.name}
                          </Text>

                          {isSaving ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.primary}
                            />
                          ) : added ? (
                            <Text
                              style={[
                                styles.presetCardAdded,
                                { color: colors.textFaint },
                              ]}
                            >
                              Added
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.textMuted, marginTop: 0 },
                  ]}
                >
                  Name
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.inputBorder, color: colors.text },
                  ]}
                  placeholder="e.g. Data & Airtime"
                  placeholderTextColor={colors.textFaint}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Type
                </Text>

                <View style={{ position: "relative" }}>
                  <Pressable
                    style={[
                      styles.dropdownButton,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBg,
                      },
                    ]}
                    onPress={() => setTypeDropdownOpen((open) => !open)}
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        { color: colors.text },
                      ]}
                    >
                      {type}
                    </Text>
                    <Text
                      style={[
                        styles.dropdownChevron,
                        { color: colors.textFaint },
                      ]}
                    >
                      {typeDropdownOpen ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {typeDropdownOpen && (
                    <View
                      style={[
                        styles.dropdownList,
                        {
                          borderColor: colors.inputBorder,
                          backgroundColor: colors.card,
                        },
                      ]}
                    >
                      {["Expense", "Income"].map((option) => (
                        <Pressable
                          key={option}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setType(option);
                            setTypeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              { color: colors.text },
                              option === type && { color: colors.primary },
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Icon
                </Text>

                <View style={styles.iconGrid}>
                  {EMOJI_OPTIONS.map((emoji, index) => (
                    <Pressable
                      key={`${emoji}-${index}`}
                      onPress={() => setIcon(emoji)}
                      style={[
                        styles.iconOption,
                        {
                          borderColor: colors.inputBorder,
                          backgroundColor: colors.inputBg,
                        },
                        icon === emoji && {
                          borderColor: colors.primary,
                          backgroundColor: colors.incomeBg,
                        },
                      ]}
                    >
                      <Text style={styles.iconOptionGlyph}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Color
                </Text>

                <View style={styles.swatchRow}>
                  {SWATCHES.map((swatch) => (
                    <Pressable
                      key={swatch}
                      onPress={() => setColor(swatch)}
                      style={[
                        styles.swatch,
                        { backgroundColor: swatch },
                        color === swatch && { borderColor: colors.text },
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
                    <Text style={styles.iconGlyph}>{icon}</Text>
                  </View>

                  <Text
                    style={[
                      styles.iconPreviewText,
                      { color: colors.textMuted },
                    ]}
                  >
                    Category preview
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={addCategory}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: colors.primaryText },
                    ]}
                  >
                    Save category
                  </Text>
                </Pressable>
              </ScrollView>
            )}
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
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  iconGlyph: {
    fontSize: 13,
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
    marginBottom: 14,
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

  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  tabButtonText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },

  quickAddScroll: {
    maxHeight: 420,
  },

  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  presetCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  presetCardText: {
    flex: 1,
  },

  presetCardName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  presetCardAdded: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
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

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },

  dropdownButtonText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  dropdownChevron: {
    fontSize: 10,
  },

  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 10,
  },

  dropdownOption: {
    paddingVertical: 11,
    paddingHorizontal: 13,
  },

  dropdownOptionText: {
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
    marginTop: 16,
  },

  iconPreviewCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  iconPreviewText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },

  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconOptionGlyph: {
    fontSize: 15,
  },

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
