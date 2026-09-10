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

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

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

import { getCurrentUser } from "../../services/auth";

import {
  startBankSynchronization,
  getBankAccounts,
  refreshBankAccount,
} from "../../services/bankSync";

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

  // --------------------------------------------------
  // MANUAL ACCOUNTS
  // --------------------------------------------------

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  // --------------------------------------------------
  // BANK SYNCHRONIZATION
  // --------------------------------------------------

  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankSyncLoading, setBankSyncLoading] = useState(false);
  const [bankSyncMessage, setBankSyncMessage] = useState("");
  const [refreshingBankId, setRefreshingBankId] = useState(null);

  // --------------------------------------------------
  // CURRENT USER
  // --------------------------------------------------

  const [currentUser, setCurrentUser] = useState(null);

  // --------------------------------------------------
  // MODALS
  // --------------------------------------------------

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);

  // --------------------------------------------------
  // ACCOUNT FORM
  // --------------------------------------------------

  const [editingAccount, setEditingAccount] = useState(null);

  const [accountName, setAccountName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [initialAmount, setInitialAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  // --------------------------------------------------
  // CURRENCY SYMBOL
  // --------------------------------------------------

  const getCurrencySymbol = (code) => {
    try {
      const formatted = formatCurrency(0, code);

      const symbol = formatted.replace(/[\d\s.,-]/g, "").trim();

      return symbol || code;
    } catch (error) {
      return code;
    }
  };

  // --------------------------------------------------
  // LOAD CURRENT USER
  // --------------------------------------------------

  const loadCurrentUser = async () => {
    try {
      const data = await getCurrentUser();

      console.log(
        "ACCOUNT CURRENT USER RESPONSE:",
        JSON.stringify(data, null, 2),
      );

      const profile = data?.user || data?.data?.user || data?.data || data;

      console.log("ACCOUNT USER PROFILE:", JSON.stringify(profile, null, 2));

      setCurrentUser(profile || null);

      return profile;
    } catch (error) {
      console.log(
        "LOAD CURRENT USER ERROR:",
        error?.response?.data || error?.message || error,
      );

      setCurrentUser(null);

      return null;
    }
  };

  // --------------------------------------------------
  // LOAD MANUAL ACCOUNTS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // LOAD CONNECTED BANK ACCOUNTS
  // --------------------------------------------------

  const loadBankAccounts = async () => {
    try {
      const response = await getBankAccounts();

      console.log("Bank accounts loaded:", response);

      setBankAccounts(response?.accounts || []);
    } catch (error) {
      console.log("Load bank accounts error:", error);

      setBankAccounts([]);
    }
  };

  // --------------------------------------------------
  // REFRESH DATA WHEN SCREEN GETS FOCUS
  // --------------------------------------------------

  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
      loadBankAccounts();
      loadCurrentUser();
    }, []),
  );

  // --------------------------------------------------
  // FILTER CURRENCIES
  // --------------------------------------------------

  const filteredCurrencies = ALL_CURRENCIES.filter((item) => {
    const search = currencySearch.toLowerCase().trim();

    return (
      item.code.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search)
    );
  });

  // --------------------------------------------------
  // ADD ACCOUNT MODAL
  // --------------------------------------------------

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  // --------------------------------------------------
  // BANK SYNCHRONIZATION
  // --------------------------------------------------

  const openBankSynchronization = async () => {
    try {
      setShowAddModal(false);

      setBankSyncLoading(true);

      setBankSyncMessage("Preparing secure bank connection...");

      // --------------------------------------------------
      // GET CURRENT USER
      // --------------------------------------------------

      let user = currentUser;

      /*
       * If the profile has not loaded yet, retrieve it now.
       */
      if (!user) {
        user = await loadCurrentUser();
      }

      console.log("BANK SYNC USER:", JSON.stringify(user, null, 2));

      // --------------------------------------------------
      // GET CUSTOMER NAME
      // --------------------------------------------------

      const customerName =
        user?.full_name || user?.name || user?.fullName || user?.username;

      // --------------------------------------------------
      // GET CUSTOMER EMAIL
      // --------------------------------------------------

      const customerEmail =
        user?.email || user?.email_address || user?.emailAddress;

      console.log("BANK SYNC CUSTOMER NAME:", customerName);

      console.log("BANK SYNC CUSTOMER EMAIL:", customerEmail);

      // --------------------------------------------------
      // VALIDATE NAME
      // --------------------------------------------------

      if (!customerName) {
        throw new Error(
          "Your account name could not be found. Please update your profile and try again.",
        );
      }

      // --------------------------------------------------
      // VALIDATE EMAIL
      // --------------------------------------------------

      if (!customerEmail) {
        throw new Error(
          "Your email address could not be found. Please update your profile and try again.",
        );
      }

      // --------------------------------------------------
      // START MONO SYNCHRONIZATION
      // --------------------------------------------------

      setBankSyncMessage("Creating secure bank connection...");

      const response = await startBankSynchronization({
        name: String(customerName).trim(),
        email: String(customerEmail).trim(),
      });

      console.log(
        "Bank synchronization initiated:",
        JSON.stringify(response, null, 2),
      );

      // --------------------------------------------------
      // VERIFY MONO LINK
      // --------------------------------------------------

      if (!response?.link) {
        throw new Error("Mono did not return a connection link.");
      }

      setBankSyncMessage("Opening secure bank connection...");

      // --------------------------------------------------
      // REDIRECT URL
      // --------------------------------------------------

      const redirectUrl = Linking.createURL("bank-sync");

      console.log("Bank synchronization redirect URL:", redirectUrl);

      // --------------------------------------------------
      // OPEN MONO
      // --------------------------------------------------

      const result = await WebBrowser.openAuthSessionAsync(
        response.link,
        redirectUrl,
      );

      console.log("Mono connection result:", JSON.stringify(result, null, 2));

      // --------------------------------------------------
      // USER CANCELLED
      // --------------------------------------------------

      if (result.type === "cancel" || result.type === "dismiss") {
        setBankSyncMessage("");

        return;
      }

      // --------------------------------------------------
      // CHECK CONNECTION
      // --------------------------------------------------

      setBankSyncMessage("Checking your bank connection...");

      /*
       * Give the backend webhook time to receive
       * Mono's account_connected event.
       */
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // --------------------------------------------------
      // RELOAD ACCOUNTS
      // --------------------------------------------------

      await loadBankAccounts();

      await loadAccounts();

      // --------------------------------------------------
      // SUCCESS
      // --------------------------------------------------

      setBankSyncMessage("Bank account connected successfully.");

      Alert.alert(
        "Bank connected",
        "Your bank account has been connected successfully. Your transactions will now be synchronized.",
      );
    } catch (error) {
      console.log("Bank synchronization error:", error);

      Alert.alert(
        "Bank synchronization failed",
        error?.error ||
          error?.message ||
          "Unable to connect your bank account. Please try again.",
      );

      setBankSyncMessage("");
    } finally {
      setBankSyncLoading(false);
    }
  };

  // --------------------------------------------------
  // REFRESH CONNECTED BANK
  // --------------------------------------------------

  const handleRefreshBankAccount = async (bankAccount) => {
    try {
      setRefreshingBankId(bankAccount.id);

      const response = await refreshBankAccount(bankAccount.id);

      console.log("Bank account refreshed:", response);

      await loadBankAccounts();

      await loadAccounts();

      Alert.alert(
        "Account synchronized",
        "Your latest bank balance and transactions have been synchronized.",
      );
    } catch (error) {
      console.log("Refresh bank account error:", error);

      Alert.alert(
        "Synchronization failed",
        error?.error ||
          error?.message ||
          "Unable to refresh this bank account.",
      );
    } finally {
      setRefreshingBankId(null);
    }
  };

  // --------------------------------------------------
  // RESET MANUAL ACCOUNT FORM
  // --------------------------------------------------

  const resetForm = () => {
    setEditingAccount(null);
    setAccountName("");
    setCurrency("NGN");
    setInitialAmount("");
    setNotes("");
    setCurrencySearch("");
    setShowCurrencyPicker(false);
  };

  // --------------------------------------------------
  // NEW ACCOUNT
  // --------------------------------------------------

  const openNewAccount = () => {
    setShowAddModal(false);

    resetForm();

    setTimeout(() => {
      setShowNewAccount(true);
    }, 200);
  };

  // --------------------------------------------------
  // EDIT ACCOUNT
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CLOSE ACCOUNT FORM
  // --------------------------------------------------

  const closeNewAccount = () => {
    if (savingAccount) {
      return;
    }

    setShowNewAccount(false);

    resetForm();
  };

  // --------------------------------------------------
  // SAVE ACCOUNT
  // --------------------------------------------------

  const handleAddAccount = async () => {
    if (!accountName.trim()) {
      Alert.alert("Missing account name", "Please enter an account name.");

      return;
    }

    if (!initialAmount.trim()) {
      Alert.alert("Missing amount", "Please enter the initial amount.");

      return;
    }

    const amount = Number(initialAmount);

    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert("Invalid amount", "Please enter a valid initial amount.");

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

      // --------------------------------------------------
      // UPDATE EXISTING ACCOUNT
      // --------------------------------------------------

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
              ? {
                  ...item,
                  ...updatedAccount,
                }
              : item,
          ),
        );

        setShowNewAccount(false);

        resetForm();

        return;
      }

      // --------------------------------------------------
      // CREATE NEW MANUAL ACCOUNT
      // --------------------------------------------------

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

      Alert.alert(
        "Unable to save account",
        error?.error ||
          error?.message ||
          "Unable to save account. Please try again.",
      );
    } finally {
      setSavingAccount(false);
    }
  };

  // --------------------------------------------------
  // DELETE MANUAL ACCOUNT
  // --------------------------------------------------

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

  // --------------------------------------------------
  // FONT LOADING
  // --------------------------------------------------

  if (!fontsLoaded) {
    return null;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
        {/* HEADER */}

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

        {/* BANK SYNC STATUS */}

        {bankSyncLoading && (
          <View
            style={[
              styles.syncStatusCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.syncStatusIcon,
                {
                  backgroundColor: colors.chipBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.syncStatusIconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ⇄
              </Text>
            </View>

            <View style={styles.syncStatusContent}>
              <Text
                style={[
                  styles.syncStatusTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Connecting bank
              </Text>

              <Text
                style={[
                  styles.syncStatusText,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                {bankSyncMessage || "Please wait..."}
              </Text>
            </View>
          </View>
        )}

        {/* CONNECTED BANK ACCOUNTS */}

        {bankAccounts.length > 0 && (
          <View style={styles.bankAccountsSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Connected Banks
            </Text>

            {bankAccounts.map((bankAccount) => (
              <View
                key={bankAccount.id}
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
                      ⇄
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
                      {bankAccount.bank_name || "Connected Bank"}
                    </Text>

                    <Text
                      style={[
                        styles.accountCurrency,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      {bankAccount.account_number_masked ||
                        "Bank account connected"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleRefreshBankAccount(bankAccount)}
                    disabled={refreshingBankId === bankAccount.id}
                    style={[
                      styles.editButton,
                      {
                        backgroundColor: colors.chipBg,
                        opacity: refreshingBankId === bankAccount.id ? 0.5 : 1,
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
                      {refreshingBankId === bankAccount.id
                        ? "Syncing..."
                        : "Refresh"}
                    </Text>
                  </Pressable>
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
                        Number(bankAccount.balance || 0),
                        bankAccount.currency || "NGN",
                      )}
                    </Text>
                  </View>

                  <View style={styles.accountNotesContainer}>
                    <Text
                      style={[
                        styles.accountBalanceLabel,
                        {
                          color: colors.textFaint,
                        },
                      ]}
                    >
                      Status
                    </Text>

                    <Text
                      style={[
                        styles.accountNotes,
                        {
                          color: colors.primary,
                        },
                      ]}
                    >
                      {bankAccount.status || "connected"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MANUAL ACCOUNT LOADING */}

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

      {/* ==================================================
          ADD ACCOUNT MODAL
          ================================================== */}

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

            {/* BANK SYNCHRONIZATION */}

            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
                bankSyncLoading && {
                  opacity: 0.6,
                },
              ]}
              onPress={openBankSynchronization}
              disabled={bankSyncLoading}
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

            {/* NEW ACCOUNT */}

            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={openNewAccount}
              disabled={bankSyncLoading}
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

      {/* ==================================================
          NEW / EDIT ACCOUNT FORM
          ================================================== */}

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

            {/* NAME */}

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

            {/* CURRENCY */}

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
                savingAccount && {
                  opacity: 0.7,
                },
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

            {/* CURRENCY PICKER */}

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

            {/* AMOUNT */}

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

            {/* NOTES */}

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

            {/* SAVE */}

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

            {/* CANCEL */}

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

// ======================================================
// STYLES
// ======================================================

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

  // --------------------------------------------------
  // BANK SYNC
  // --------------------------------------------------

  syncStatusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  syncStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  syncStatusIconText: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },

  syncStatusContent: {
    flex: 1,
  },

  syncStatusTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },

  syncStatusText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },

  bankAccountsSection: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },

  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // ACCOUNT CARD
  // --------------------------------------------------

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
    width: 35,
    height: 35,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  accountIconText: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_500Medium",
  },

  accountInfo: {
    flex: 1,
  },

  accountName: {
    fontSize: 10,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  accountCurrency: {
    fontSize: 8,
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
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },

  deleteButton: {
    width: 18,
    height: 18,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 12,
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
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },

  accountBalance: {
    fontSize: 13,
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
