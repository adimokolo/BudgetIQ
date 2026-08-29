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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../../services/categories";
import { useTheme } from "../../contexts/ThemeContext";

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
    <View style={[styles.categoryRow, { borderTopColor: colors.divider }]}>
      <View style={styles.categoryLeft}>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
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
  const [name, setName] = useState("");
  const [type, setType] = useState("Expense");
  const [color, setColor] = useState(SWATCHES[0]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const data = await getCategories();

      console.log("Categories from API:", data);

      // Adjust this section if your backend response
      // uses a different property name.

      const categories = Array.isArray(data) ? data : data.categories || [];

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

      const categories = Array.isArray(data) ? data : data.categories || [];

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

      // Reload categories from backend
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

  if (loading) {
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
        refreshing={refreshing}
        onRefresh={refreshCategories}
      >
        {/* Header */}
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
          >
            <Text style={[styles.addButtonText, { color: colors.primaryText }]}>
              + New category
            </Text>
          </TouchableOpacity>
        </View>

        {/* Income */}
        <CategorySection
          title="Income"
          categories={incomeCategories}
          onDelete={handleDeleteCategory}
          colors={colors}
        />

        {/* Expense */}
        <CategorySection
          title="Expense"
          categories={expenseCategories}
          onDelete={handleDeleteCategory}
          colors={colors}
        />
      </ScrollView>

      {/* Add Category Modal */}
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
              >
                <Text style={[styles.closeButton, { color: colors.textFaint }]}>
                  ×
                </Text>
              </Pressable>
            </View>

            {/* NAME */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              Category name
            </Text>

            <TextInput
              style={[
                styles.input,
                { borderColor: colors.inputBorder, color: colors.text },
              ]}
              placeholder="e.g. Subscriptions"
              placeholderTextColor={colors.textFaint}
              value={name}
              onChangeText={setName}
            />

            {/* TYPE */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              Category type
            </Text>

            <View style={styles.typeButtons}>
              <Pressable
                style={[
                  styles.typeButton,
                  { borderColor: colors.inputBorder },
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
                    { color: colors.textMuted },
                    type === "Income" && { color: colors.income },
                  ]}
                >
                  Income
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  { borderColor: colors.inputBorder },
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
                    { color: colors.textMuted },
                    type === "Expense" && { color: colors.expense },
                  ]}
                >
                  Expense
                </Text>
              </Pressable>
            </View>

            {/* COLOR */}
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
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={addCategory}
            >
              <Text
                style={[styles.saveButtonText, { color: colors.primaryText }]}
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
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
  },

  subheading: {
    fontSize: 14,
    marginTop: 5,
  },

  addButton: {
    marginTop: 18,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* Sections */
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  sectionSubtitle: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: "600",
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
    fontWeight: "700",
  },

  /* Empty State */
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 13,
  },

  /* Add Category Modal */
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
    fontWeight: "800",
  },

  closeButton: {
    fontSize: 22,
    fontWeight: "700",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: "700",
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
    fontSize: 14,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
