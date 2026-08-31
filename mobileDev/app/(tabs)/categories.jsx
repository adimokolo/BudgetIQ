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
];

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
            styles.dot,
            {
              backgroundColor: category.color || colors.primary,
            },
          ]}
        />

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
    setColor(SWATCHES[0]);
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

  /* HEADER */

  header: {
    marginBottom: 24,
  },

  heading: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  subheading: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 15,
  },

  addButton: {
    marginTop: 18,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  addButtonText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },

  /* SECTIONS */

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

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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

  /* EMPTY STATE */

  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  /* ADD CATEGORY MODAL */

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    borderRadius: 16,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  closeButton: {
    fontSize: 22,
    lineHeight: 22,
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
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },

  /* LOADING */

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
