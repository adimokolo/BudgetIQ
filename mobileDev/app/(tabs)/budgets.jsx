import React, { useCallback, useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useFonts } from "expo-font";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
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

import { checkBudgetNotifications } from "../../services/notifications";

import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget as deleteBudgetApi,
} from "../../services/budgets";

import { getCategories } from "../../services/categories";

import { useTheme } from "../../contexts/ThemeContext";

function progressColor(percent, colors) {
  if (percent >= 100) {
    return colors.danger;
  }

  if (percent >= 80) {
    return colors.caution;
  }

  return colors.income;
}

function formatAmount(amount) {
  const numericAmount = Number(amount) || 0;

  return numericAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function BudgetCard({ budget, onEdit, onDelete, colors }) {
  const spent = Number(budget.spent_this_month || 0);
  const limit = Number(budget.monthly_limit || 0);

  let percent = Number(budget.percent_used);

  if (!Number.isFinite(percent)) {
    percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  }

  const safePercent = Math.max(percent, 0);
  const barPercent = Math.min(safePercent, 100);

  const barColor = progressColor(safePercent, colors);

  return (
    <View
      style={[
        styles.budgetCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: budget.category_color || colors.textFaint,
              },
            ]}
          />

          <Text
            style={[
              styles.budgetName,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {budget.category_name || "Uncategorized"}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => onEdit(budget)}
            hitSlop={8}
            style={[
              styles.editButton,
              {
                backgroundColor: colors.chipBg,
              },
            ]}
          >
            <Text
              style={[
                styles.editButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(budget)}
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
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.divider,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${barPercent}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.budgetFooter}>
        <Text
          style={[
            styles.budgetSpent,
            {
              color: colors.text,
            },
          ]}
        >
          ₦{formatAmount(spent)}{" "}
          <Text
            style={[
              styles.budgetOf,
              {
                color: colors.textFaint,
              },
            ]}
          >
            of ₦{formatAmount(limit)}
          </Text>
        </Text>

        <Text
          style={[
            styles.budgetPercent,
            {
              color: barColor,
            },
          ]}
        >
          {safePercent}%
        </Text>
      </View>

      {safePercent >= 100 && (
        <Text
          style={[
            styles.warningText,
            {
              color: colors.danger,
            },
          ]}
        >
          You have exceeded this budget.
        </Text>
      )}

      {safePercent >= 80 && safePercent < 100 && (
        <Text
          style={[
            styles.cautionText,
            {
              color: colors.caution,
            },
          ]}
        >
          You are approaching your budget limit.
        </Text>
      )}

      {safePercent < 80 && (
        <Text
          style={[
            styles.safeText,
            {
              color: colors.income,
            },
          ]}
        >
          You are within your budget.
        </Text>
      )}
    </View>
  );
}

export default function Budgets() {
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,

    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,

    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [limit, setLimit] = useState("");

  const [editingBudget, setEditingBudget] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBudgets = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [budgetsResponse, categoriesResponse] = await Promise.all([
        getBudgets(),
        getCategories(),
      ]);

      console.log("Budgets API response:", budgetsResponse);

      const loadedBudgets =
        budgetsResponse?.budgets || budgetsResponse?.data || [];

      setBudgets(loadedBudgets);

      try {
        await checkBudgetNotifications(loadedBudgets);
      } catch (notificationError) {
        console.log("Budget notification check error:", notificationError);
      }

      const categories =
        categoriesResponse?.categories || categoriesResponse?.data || [];

      const expenseOnlyCategories = categories.filter(
        (category) => category.type?.toLowerCase() === "expense",
      );

      setExpenseCategories(expenseOnlyCategories);
    } catch (error) {
      console.log("Get budgets error:", error);

      Alert.alert(
        "Unable to load budgets",
        error?.message ||
          error?.error ||
          "Something went wrong while loading your budgets.",
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBudgets(true);
    }, [loadBudgets]),
  );

  const refreshBudgets = async () => {
    try {
      setRefreshing(true);

      await loadBudgets(false);
    } catch (error) {
      console.log("Refresh budgets error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setLimit("");
    setEditingBudget(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);

    setSelectedCategory({
      id: budget.category_id,
      name: budget.category_name || "Uncategorized",
      color: budget.category_color || colors.textFaint,
    });

    setLimit(String(budget.monthly_limit ?? ""));

    setShowAddModal(true);
  };

  const saveBudget = async () => {
    const trimmedLimit = limit.trim();

    const numericLimit = Number(trimmedLimit);

    if (!trimmedLimit || !Number.isFinite(numericLimit) || numericLimit <= 0) {
      Alert.alert(
        "Invalid monthly limit",
        "Please enter a monthly limit greater than zero.",
      );

      return;
    }

    if (!editingBudget && !selectedCategory) {
      Alert.alert("Missing information", "Please select a category.");

      return;
    }

    if (!editingBudget) {
      const duplicate = budgets.some(
        (budget) => String(budget.category_id) === String(selectedCategory.id),
      );

      if (duplicate) {
        Alert.alert(
          "Budget already set",
          `${selectedCategory.name} already has a monthly budget. Edit the existing budget instead.`,
        );

        return;
      }
    }

    try {
      setSaving(true);

      if (editingBudget) {
        console.log("Updating budget:", editingBudget.id);

        console.log("Update payload:", {
          monthlyLimit: numericLimit,
        });

        await updateBudget(editingBudget.id, {
          monthlyLimit: numericLimit,
        });

        Alert.alert(
          "Budget updated",
          `${selectedCategory.name} budget has been updated successfully.`,
        );
      } else {
        const payload = {
          categoryId: selectedCategory.id,
          monthlyLimit: numericLimit,
        };

        console.log("Creating budget:", payload);

        await createBudget(payload);

        Alert.alert(
          "Budget created",
          `${selectedCategory.name} budget has been created successfully.`,
        );
      }

      resetForm();
      setShowAddModal(false);

      await loadBudgets(true);
    } catch (error) {
      console.log("Save budget error:", error);

      const errorMessage =
        error?.error ||
        error?.message ||
        "Something went wrong while saving your budget.";

      Alert.alert("Unable to save budget", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = (budget) => {
    Alert.alert(
      "Delete budget",
      `Are you sure you want to remove the ${budget.category_name} budget?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            const previousBudgets = budgets;

            setBudgets((current) =>
              current.filter((item) => item.id !== budget.id),
            );

            try {
              console.log("Deleting budget:", budget.id);

              await deleteBudgetApi(budget.id);

              const updatedBudgets = previousBudgets.filter(
                (item) => item.id !== budget.id,
              );

              await checkBudgetNotifications(updatedBudgets);
            } catch (error) {
              console.log("Delete budget error:", error);

              setBudgets(previousBudgets);

              Alert.alert(
                "Unable to delete budget",
                error?.error ||
                  error?.message ||
                  "Something went wrong while deleting the budget.",
              );
            }
          },
        },
      ],
    );
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    resetForm();
    setShowAddModal(false);
  };

  if (!fontsLoaded) {
    return null;
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
            onRefresh={refreshBudgets}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
            >
              Budgets
            </Text>

            <Text
              style={[
                styles.subheading,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Set monthly limits and see how close you are to them.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={openAddModal}
            disabled={loading}
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: colors.primaryText,
                },
              ]}
            >
              + Set budget
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View
            style={[
              styles.loadingContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />

            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Loading budgets...
            </Text>
          </View>
        ) : budgets.length > 0 ? (
          <View style={styles.budgetList}>
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={openEditModal}
                onDelete={deleteBudget}
                colors={colors}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.chipBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyIconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ₦
              </Text>
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              No budgets yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Set a monthly limit to start tracking your spending.
            </Text>

            <TouchableOpacity
              style={[
                styles.emptyButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={openAddModal}
            >
              <Text
                style={[
                  styles.emptyButtonText,
                  {
                    color: colors.primaryText,
                  },
                ]}
              >
                Set your first budget
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalOverlay,
            {
              backgroundColor: colors.overlay,
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {editingBudget ? "Edit budget" : "Set budget"}
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  {editingBudget
                    ? "Update your monthly spending limit."
                    : "Create a monthly spending limit."}
                </Text>
              </View>

              <Pressable onPress={closeModal} disabled={saving} hitSlop={10}>
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

            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Category
            </Text>

            {expenseCategories.length > 0 ? (
              <View style={styles.categoryChips}>
                {expenseCategories.map((category) => {
                  const isSelected =
                    String(selectedCategory?.id) === String(category.id);

                  const categoryColor = category.color || colors.textFaint;

                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        {
                          borderColor: colors.inputBorder,
                        },
                        isSelected && {
                          backgroundColor: categoryColor + "22",
                          borderColor: categoryColor,
                        },
                      ]}
                      onPress={() => {
                        if (!saving && !editingBudget) {
                          setSelectedCategory(category);
                        }
                      }}
                      disabled={saving || Boolean(editingBudget)}
                    >
                      <View
                        style={[
                          styles.chipDot,
                          {
                            backgroundColor: categoryColor,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: colors.textMuted,
                          },
                          isSelected && {
                            color: colors.text,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                No expense categories yet. Add one on the Categories screen
                first.
              </Text>
            )}

            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Monthly limit
            </Text>

            <View
              style={[
                styles.amountInputContainer,
                {
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.currencySymbol,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                ₦
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textFaint}
                value={limit}
                onChangeText={setLimit}
                keyboardType="decimal-pad"
                editable={!saving}
                autoFocus={false}
              />
            </View>

            <Pressable
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                },
                saving && styles.disabledButton,
              ]}
              onPress={saveBudget}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: colors.primaryText,
                    },
                  ]}
                >
                  {editingBudget ? "Update budget" : "Set budget"}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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

  headerTextContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  subheading: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 15,
  },

  addButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  addButtonText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  loadingContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    fontSize: 18,
    fontFamily: "JetBrainsMono_500Medium",
  },

  emptyTitle: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },

  emptyButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  emptyButtonText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  budgetList: {
    gap: 10,
  },

  budgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },

  budgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  budgetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },

  budgetName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  editButtonText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },

  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 13,
    lineHeight: 13,
    fontFamily: "Inter_600SemiBold",
  },

  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: 7,
    borderRadius: 4,
  },

  budgetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  budgetSpent: {
    fontSize: 12,
    fontFamily: "JetBrainsMono_500Medium",
  },

  budgetOf: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
  },

  budgetPercent: {
    fontSize: 12,
    fontFamily: "JetBrainsMono_500Medium",
  },

  warningText: {
    marginTop: 9,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  cautionText: {
    marginTop: 9,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  safeText: {
    marginTop: 9,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitleContainer: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  modalSubtitle: {
    fontSize: 9.5,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },

  closeButton: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },

  inputLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 12,
  },

  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },

  categoryChipText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 13,
  },

  currencySymbol: {
    fontSize: 13,
    fontFamily: "JetBrainsMono_500Medium",
  },

  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 9,
    fontSize: 12,
    fontFamily: "JetBrainsMono_400Regular",
  },

  saveButton: {
    marginTop: 20,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
