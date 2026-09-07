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

import { useTheme } from "../../contexts/ThemeContext";

import {
  ALL_CURRENCIES,
  currencyLabel,
  formatCurrency,
} from "../../utils/currency";

import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount as deleteAccountApi,
} from "../../services/accounts";

export default function Account() {
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

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);

  const [editingAccount, setEditingAccount] = useState(null);

  const [accountName, setAccountName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [initialAmount, setInitialAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const getCurrencySymbol = (code) => {
    try {
      const formatted = formatCurrency(0, code);
      const symbol = formatted.replace(/[\d\s.,-]/g, "").trim();
      return symbol || code;
    } catch (error) {
      return code;
    }
  };

  const loadAccounts = async () => {
    try {
      setAccountsLoading(true);
      const response = await getAccounts();
      console.log("Accounts loaded:", response);
      setAccounts(response?.accounts || []);
    } catch (error) {
      console.log("Load accounts error:", error);
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, []),
  );

  const filteredCurrencies = ALL_CURRENCIES.filter((item) => {
    const search = currencySearch.toLowerCase().trim();
    return (
      item.code.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search)
    );
  });

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openBankSynchronization = () => {
    setShowAddModal(false);
    setTimeout(() => {
      setShowComingSoon(true);
    }, 200);
  };

  const resetForm = () => {
    setEditingAccount(null);
    setAccountName("");
    setCurrency("NGN");
    setInitialAmount("");
    setNotes("");
    setCurrencySearch("");
    setShowCurrencyPicker(false);
  };

  const openNewAccount = () => {
    setShowAddModal(false);
    resetForm();
    setTimeout(() => {
      setShowNewAccount(true);
    }, 200);
  };

  const openEditAccount = (account) => {
    setEditingAccount(account);
    setAccountName(account.name || "");
    setCurrency(account.currency || "NGN");
    setInitialAmount(String(account.balance ?? ""));
    setNotes(account.notes || "");
    setCurrencySearch("");
    setShowCurrencyPicker(false);
    setShowNewAccount(true);
  };

  const closeNewAccount = () => {
    if (savingAccount) {
      return;
    }
    setShowNewAccount(false);
    resetForm();
  };

  const handleAddAccount = async () => {
    if (!accountName.trim()) {
      alert("Please enter an account name.");
      return;
    }

    if (!initialAmount.trim()) {
      alert("Please enter the initial amount.");
      return;
    }

    const amount = Number(initialAmount);

    if (Number.isNaN(amount) || amount < 0) {
      alert("Please enter a valid initial amount.");
      return;
    }

    try {
      setSavingAccount(true);

      const accountData = {
        name: accountName.trim(),
        currency,
        initialAmount: amount,
        notes: notes.trim() || null,
      };

      if (editingAccount) {
        console.log("Updating account:", editingAccount.id, accountData);

        const response = await updateAccount(editingAccount.id, accountData);
        console.log("Account updated:", response);

        const updatedAccount = response?.account || {
          ...editingAccount,
          name: accountData.name,
          currency: accountData.currency,
          balance: amount,
          notes: accountData.notes,
        };

        setAccounts((currentAccounts) =>
          currentAccounts.map((item) =>
            item.id === editingAccount.id
              ? { ...item, ...updatedAccount }
              : item,
          ),
        );

        setShowNewAccount(false);
        resetForm();
        return;
      }

      console.log("Creating account:", accountData);

      const response = await createAccount(accountData);
      console.log("Account created:", response);

      if (response?.account) {
        setAccounts((currentAccounts) => [
          response.account,
          ...currentAccounts,
        ]);
      }

      setShowNewAccount(false);
      resetForm();
    } catch (error) {
      console.log("Save account error:", error);

      alert(
        error?.error ||
          error?.message ||
          "Unable to save account. Please try again.",
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const deleteAccount = (account) => {
    Alert.alert(
      "Delete account",
      `Are you sure you want to remove "${account.name}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            const previousAccounts = accounts;

            setAccounts((current) =>
              current.filter((item) => item.id !== account.id),
            );

            try {
              console.log("Deleting account:", account.id);
              await deleteAccountApi(account.id);
            } catch (error) {
              console.log("Delete account error:", error);

              setAccounts(previousAccounts);

              Alert.alert(
                "Unable to delete account",
                error?.error ||
                  error?.message ||
                  "Something went wrong while deleting the account.",
              );
            }
          },
        },
      ],
    );
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
              Account
            </Text>

            <Text
              style={[
                styles.subheading,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Manage your bank accounts and financial connections.
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
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: colors.primaryText,
                },
              ]}
            >
              + Add account
            </Text>
          </TouchableOpacity>
        </View>

        {accountsLoading ? (
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
              Loading accounts...
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Please wait while your accounts are being loaded.
            </Text>
          </View>
        ) : accounts.length === 0 ? (
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
              No accounts yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Add a bank account to keep your finances organized and connected.
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
                Add your first account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {accounts.map((account) => (
              <View
                key={account.id}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.accountCardTop}>
                  <View
                    style={[
                      styles.accountIcon,
                      {
                        backgroundColor: colors.chipBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountIconText,
                        {
                          color: colors.primary,
                        },
                      ]}
                    >
                      {getCurrencySymbol(account.currency)}
                    </Text>
                  </View>

                  <View style={styles.accountInfo}>
                    <Text
                      style={[
                        styles.accountName,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {account.name}
                    </Text>

                    <Text
                      style={[
                        styles.accountCurrency,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      {currencyLabel(account.currency)}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => openEditAccount(account)}
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
                      onPress={() => deleteAccount(account)}
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
                    styles.accountDivider,
                    {
                      backgroundColor: colors.divider,
                    },
                  ]}
                />

                <View style={styles.accountBalanceRow}>
                  <View>
                    <Text
                      style={[
                        styles.accountBalanceLabel,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Balance
                    </Text>

                    <Text
                      style={[
                        styles.accountBalance,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {formatCurrency(
                        Number(account.balance),
                        account.currency,
                      )}
                    </Text>
                  </View>

                  {account.notes ? (
                    <View style={styles.accountNotesContainer}>
                      <Text
                        style={[
                          styles.accountBalanceLabel,
                          {
                            color: colors.textFaint,
                          },
                        ]}
                      >
                        Note
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.accountNotes,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        {account.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ADD ACCOUNT MODAL */}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
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
                  Add account
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  Choose how you want to add your account.
                </Text>
              </View>

              <Pressable onPress={closeAddModal} hitSlop={10}>
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

            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={openBankSynchronization}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: colors.chipBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionIconText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ⇄
                </Text>
              </View>

              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Bank Synchronization
                </Text>

                <Text
                  style={[
                    styles.optionDescription,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  Connect your bank account and automatically synchronize your
                  transactions.
                </Text>
              </View>

              <Text
                style={[
                  styles.chevron,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                ›
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={openNewAccount}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: colors.chipBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionIconText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  +
                </Text>
              </View>

              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  New Account
                </Text>

                <Text
                  style={[
                    styles.optionDescription,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  Manually create a new account and enter its details yourself.
                </Text>
              </View>

              <Text
                style={[
                  styles.chevron,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                ›
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* COMING SOON MODAL */}

      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
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
              styles.comingSoonCard,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <View
              style={[
                styles.comingSoonIcon,
                {
                  backgroundColor: colors.chipBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.comingSoonIconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ⇄
              </Text>
            </View>

            <Text
              style={[
                styles.comingSoonTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Coming Soon
            </Text>

            <Text
              style={[
                styles.comingSoonText,
                {
                  color: colors.textFaint,
                },
              ]}
            >
              Bank synchronization is currently under development. You'll be
              able to securely connect your bank accounts and automatically sync
              transactions soon.
            </Text>

            <Pressable
              style={[
                styles.continueButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setShowComingSoon(false)}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  {
                    color: colors.primaryText,
                  },
                ]}
              >
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* NEW / EDIT ACCOUNT FORM */}

      <Modal
        visible={showNewAccount}
        transparent
        animationType="slide"
        onRequestClose={closeNewAccount}
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
              styles.formCard,
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
                  {editingAccount ? "Edit Account" : "New Account"}
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: colors.textFaint,
                    },
                  ]}
                >
                  {editingAccount
                    ? "Update your account details below."
                    : "Enter your account details below."}
                </Text>
              </View>

              <Pressable onPress={closeNewAccount} hitSlop={10}>
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
              Name
            </Text>

            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="e.g. Main Bank Account"
              placeholderTextColor={colors.textFaint}
              value={accountName}
              onChangeText={setAccountName}
              editable={!savingAccount}
            />

            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Account currency
            </Text>

            <Pressable
              style={[
                styles.selectInput,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                },
                savingAccount && { opacity: 0.7 },
              ]}
              onPress={() => {
                if (savingAccount) {
                  return;
                }

                setCurrencySearch("");
                setShowCurrencyPicker(!showCurrencyPicker);
              }}
            >
              <Text
                style={[
                  styles.selectText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {currencyLabel(currency)}
              </Text>

              <Text
                style={[
                  styles.selectArrow,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                {showCurrencyPicker ? "⌃" : "⌄"}
              </Text>
            </Pressable>

            {showCurrencyPicker && (
              <View
                style={[
                  styles.currencyDropdown,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.currencySearchContainer,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencySearchIcon,
                      {
                        color: colors.textFaint,
                      },
                    ]}
                  >
                    ⌕
                  </Text>

                  <TextInput
                    style={[
                      styles.currencySearchInput,
                      {
                        color: colors.text,
                      },
                    ]}
                    placeholder="Search currency..."
                    placeholderTextColor={colors.textFaint}
                    value={currencySearch}
                    onChangeText={setCurrencySearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <ScrollView
                  style={styles.currencyList}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.map((item) => (
                      <Pressable
                        key={item.code}
                        style={[
                          styles.currencyOption,
                          {
                            borderBottomColor: colors.divider,
                          },
                        ]}
                        onPress={() => {
                          setCurrency(item.code);
                          setCurrencySearch("");
                          setShowCurrencyPicker(false);
                        }}
                      >
                        <View>
                          <Text
                            style={[
                              styles.currencyCode,
                              {
                                color: colors.text,
                              },
                            ]}
                          >
                            {item.code}
                          </Text>

                          <Text
                            style={[
                              styles.currencyName,
                              {
                                color: colors.textFaint,
                              },
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.currencySymbol,
                            {
                              color: colors.primary,
                            },
                          ]}
                        >
                          {getCurrencySymbol(item.code)}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.noCurrencyResults}>
                      <Text
                        style={[
                          styles.noCurrencyResultsText,
                          {
                            color: colors.textFaint,
                          },
                        ]}
                      >
                        No currencies found
                      </Text>
                    </View>
                  )}
                </ScrollView>
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
              {editingAccount ? "Balance" : "Initial amount"}
            </Text>

            <View
              style={[
                styles.amountInputContainer,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.currencyPrefix,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {getCurrencySymbol(currency)}
              </Text>

              <TextInput
                style={[
                  styles.amountInput,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textFaint}
                value={initialAmount}
                onChangeText={setInitialAmount}
                keyboardType="decimal-pad"
                editable={!savingAccount}
              />
            </View>

            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Notes
              <Text
                style={{
                  color: colors.textFaint,
                }}
              >
                {" "}
                optional
              </Text>
            </Text>

            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Add a note about this account..."
              placeholderTextColor={colors.textFaint}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              editable={!savingAccount}
            />

            <Pressable
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: savingAccount ? 0.7 : 1,
                },
              ]}
              onPress={handleAddAccount}
              disabled={savingAccount}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color: colors.primaryText,
                  },
                ]}
              >
                {savingAccount
                  ? editingAccount
                    ? "Updating Account..."
                    : "Adding Account..."
                  : editingAccount
                    ? "Update Account"
                    : "Add Account"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={closeNewAccount}
              disabled={savingAccount}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Cancel
              </Text>
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

  accountCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  accountCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  accountIconText: {
    fontSize: 16,
    fontFamily: "JetBrainsMono_500Medium",
  },

  accountInfo: {
    flex: 1,
  },

  accountName: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  accountCurrency: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
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

  accountDivider: {
    height: 1,
    marginVertical: 14,
  },

  accountBalanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  accountBalanceLabel: {
    fontSize: 8.5,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },

  accountBalance: {
    fontSize: 16,
    fontFamily: "JetBrainsMono_500Medium",
  },

  accountNotesContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 20,
  },

  accountNotes: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    maxWidth: 140,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    borderRadius: 16,
    padding: 20,
  },

  formCard: {
    borderRadius: 16,
    padding: 20,
    maxHeight: "92%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitleContainer: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 14,
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

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  optionIconText: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  optionContent: {
    flex: 1,
    paddingRight: 8,
  },

  optionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },

  chevron: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
  },

  comingSoonCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },

  comingSoonIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  comingSoonIconText: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  comingSoonTitle: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },

  comingSoonText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 290,
  },

  continueButton: {
    marginTop: 20,
    width: "100%",
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: "center",
  },

  continueButtonText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  inputLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 12,
  },

  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  selectInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  selectArrow: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },

  currencyDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 5,
    overflow: "hidden",
  },

  currencySearchContainer: {
    borderWidth: 1,
    borderRadius: 9,
    margin: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  currencySearchIcon: {
    fontSize: 17,
    marginRight: 6,
    fontFamily: "Inter_500Medium",
  },

  currencySearchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  currencyList: {
    maxHeight: 240,
  },

  currencyOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  currencyCode: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  currencyName: {
    fontSize: 8.5,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  currencySymbol: {
    fontSize: 13,
    fontFamily: "JetBrainsMono_500Medium",
  },

  noCurrencyResults: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  noCurrencyResultsText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },

  amountInputContainer: {
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },

  currencyPrefix: {
    fontSize: 12,
    fontFamily: "JetBrainsMono_500Medium",
  },

  amountInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 9,
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
  },

  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 75,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  saveButton: {
    marginTop: 20,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
