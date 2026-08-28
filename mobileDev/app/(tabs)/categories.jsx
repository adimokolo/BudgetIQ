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

function CategoryRow({ category, onDelete }) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryLeft}>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
        <Text style={styles.categoryName}>{category.name}</Text>
      </View>

      <Pressable
        onPress={() => onDelete(category.id)}
        hitSlop={8}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </Pressable>
    </View>
  );
}

function CategorySection({ title, categories, onDelete }) {
  const count = categories.length;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>
        {count} {count === 1 ? "category" : "categories"}
      </Text>

      {categories.length > 0 ? (
        <View style={styles.categoryList}>
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No categories yet.</Text>
        </View>
      )}
    </View>
  );
}

export default function Categories() {
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
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#174E78" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refreshCategories}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Categories</Text>

            <Text style={styles.subheading}>
              Organize income and spending so patterns are easy to spot.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ New category</Text>
          </TouchableOpacity>
        </View>

        {/* Income */}
        <CategorySection
          title="Income"
          categories={incomeCategories}
          onDelete={handleDeleteCategory}
        />

        {/* Expense */}
        <CategorySection
          title="Expense"
          categories={expenseCategories}
          onDelete={handleDeleteCategory}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New category</Text>

              <Pressable
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            {/* NAME */}
            <Text style={styles.inputLabel}>Category name</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Subscriptions"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />

            {/* TYPE */}
            <Text style={styles.inputLabel}>Category type</Text>

            <View style={styles.typeButtons}>
              <Pressable
                style={[
                  styles.typeButton,
                  type === "Income" && styles.activeIncomeButton,
                ]}
                onPress={() => setType("Income")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "Income" && styles.activeIncomeText,
                  ]}
                >
                  Income
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  type === "Expense" && styles.activeExpenseButton,
                ]}
                onPress={() => setType("Expense")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "Expense" && styles.activeExpenseText,
                  ]}
                >
                  Expense
                </Text>
              </Pressable>
            </View>

            {/* COLOR */}
            <Text style={styles.inputLabel}>Color</Text>

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
                    color === swatch && styles.swatchSelected,
                  ]}
                />
              ))}
            </View>

            {/* SAVE */}
            <Pressable style={styles.saveButton} onPress={addCategory}>
              <Text style={styles.saveButtonText}>Add category</Text>
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
    backgroundColor: "#F9FAFB",
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
    color: "#111827",
  },

  subheading: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },

  addButton: {
    marginTop: 18,
    backgroundColor: "#174E78",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Sections */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
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
    borderTopColor: "#F3F4F6",
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
    color: "#374151",
  },

  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 16,
    lineHeight: 16,
    color: "#9CA3AF",
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
    color: "#9CA3AF",
  },

  /* Add Category Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
  },

  closeButton: {
    fontSize: 22,
    color: "#9CA3AF",
    fontWeight: "700",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#111827",
  },

  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  typeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },

  activeIncomeButton: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },

  activeIncomeText: {
    color: "#16A34A",
  },

  activeExpenseButton: {
    backgroundColor: "#FCE7F3",
    borderColor: "#EC4899",
  },

  activeExpenseText: {
    color: "#EC4899",
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

  swatchSelected: {
    borderColor: "#111827",
  },

  saveButton: {
    marginTop: 20,
    backgroundColor: "#174E78",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
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
    color: "#6B7280",
  },
});
