import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [incomeCategories, setIncomeCategories] = useState([
    { id: "1", name: "Freelance", color: "#3B82F6" },
    { id: "2", name: "Salary", color: "#16A34A" },
  ]);

  const [expenseCategories, setExpenseCategories] = useState([
    { id: "3", name: "Entertainment", color: "#7C6FF0" },
    { id: "4", name: "Food & Groceries", color: "#EC4899" },
    { id: "5", name: "Health", color: "#F59E0B" },
    { id: "6", name: "Housing & Utilities", color: "#7C6FF0" },
    { id: "7", name: "Savings", color: "#2DD4BF" },
    { id: "8", name: "Transport", color: "#FBBF24" },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Expense");
  const [color, setColor] = useState(SWATCHES[0]);

  const resetForm = () => {
    setName("");
    setType("Expense");
    setColor(SWATCHES[0]);
  };

  const addCategory = () => {
    if (!name.trim()) {
      Alert.alert("Missing information", "Please enter a category name.");
      return;
    }

    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      color,
    };

    if (type === "Income") {
      setIncomeCategories((current) => [...current, newCategory]);
    } else {
      setExpenseCategories((current) => [...current, newCategory]);
    }

    resetForm();
    setShowAddModal(false);
  };

  const deleteIncomeCategory = (id) => {
    setIncomeCategories((current) => current.filter((c) => c.id !== id));
  };

  const deleteExpenseCategory = (id) => {
    setExpenseCategories((current) => current.filter((c) => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
          onDelete={deleteIncomeCategory}
        />

        {/* Expense */}
        <CategorySection
          title="Expense"
          categories={expenseCategories}
          onDelete={deleteExpenseCategory}
        />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
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
                    { backgroundColor: swatch },
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

  /* Header */
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
});
