import AdBanner from "../../components/AdBanner";
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
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useFonts } from "expo-font";

import * as DocumentPicker from "expo-document-picker";

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

import { getBankAccounts, refreshBankAccount } from "../../services/bankSync";
import {
  previewStatement,
  previewEmailAlerts,
  updateEmailTypes,
  confirmImport,
} from "../../services/bankImport";

const NIGERIAN_BANKS = [
  ["Access Bank", "Commercial bank", "#F58220"],
  ["Citibank Nigeria", "Commercial bank", "#056DAE"],
  ["Ecobank Nigeria", "Commercial bank", "#146A45"],
  ["Fidelity Bank", "Commercial bank", "#207E39"],
  ["First Bank of Nigeria", "Commercial bank", "#12458B"],
  ["First City Monument Bank (FCMB)", "Commercial bank", "#6C3C90"],
  ["Globus Bank", "Commercial bank", "#006D76"],
  ["Guaranty Trust Bank (GTBank)", "Commercial bank", "#E85A13"],
  ["Keystone Bank", "Commercial bank", "#0B6A8D"],
  ["Nova Bank", "Commercial bank", "#263B85"],
  ["Optimus Bank", "Commercial bank", "#103B78"],
  ["Parallex Bank", "Commercial bank", "#1E5595"],
  ["Polaris Bank", "Commercial bank", "#234AA2"],
  ["PremiumTrust Bank", "Commercial bank", "#0B6779"],
  ["Providus Bank", "Commercial bank", "#5E428A"],
  ["Signature Bank", "Commercial bank", "#295C8C"],
  ["Stanbic IBTC Bank", "Commercial bank", "#125DAA"],
  ["Standard Chartered Bank Nigeria", "Commercial bank", "#138E7A"],
  ["Sterling Bank", "Commercial bank", "#C9212C"],
  ["SunTrust Bank", "Commercial bank", "#DF8D21"],
  ["Titan Trust Bank", "Commercial bank", "#174C77"],
  ["Union Bank of Nigeria", "Commercial bank", "#1484BA"],
  ["United Bank for Africa (UBA)", "Commercial bank", "#C91E2F"],
  ["Unity Bank", "Commercial bank", "#245F9C"],
  ["Wema Bank", "Commercial bank", "#8C367D"],
  ["Zenith Bank", "Commercial bank", "#C51E2D"],

  ["Alternative Bank", "Non-interest bank", "#147D52"],
  ["Jaiz Bank", "Non-interest bank", "#14633D"],
  ["Lotus Bank", "Non-interest bank", "#168B71"],
  ["TAJBank", "Non-interest bank", "#2B7A55"],

  ["Coronation Merchant Bank", "Merchant bank", "#8B5D3B"],
  ["FBNQuest Merchant Bank", "Merchant bank", "#31568D"],
  ["Greenwich Merchant Bank", "Merchant bank", "#286C59"],
  ["Rand Merchant Bank Nigeria", "Merchant bank", "#42658B"],

  ["9 Payment Service Bank (9PSB)", "Payment service bank", "#40A629"],
  ["Hope Payment Service Bank", "Payment service bank", "#1C6B48"],
  ["MoneyMaster Payment Service Bank", "Payment service bank", "#F2B705"],
  ["MoMo Payment Service Bank", "Payment service bank", "#FFCC00"],
  ["SmartCash Payment Service Bank", "Payment service bank", "#E41E2B"],
  ["Chams Mobile", "Mobile money / fintech", "#3055A4"],
  ["eTranzact PocketMoni", "Mobile money / fintech", "#0E7B45"],
  ["KongaPay", "Mobile money / fintech", "#E51A8A"],
  ["NowNow", "Mobile money / fintech", "#6BBE45"],
  ["OPay", "Mobile money / fintech", "#00B875"],
  ["Paga", "Mobile money / fintech", "#EF7D00"],
  ["PalmPay", "Mobile money / fintech", "#6D43D9"],
  ["Pocket by PiggyVest", "Mobile money / fintech", "#1B9C85"],
  ["Teasy Mobile Money", "Mobile money / fintech", "#167B55"],
  ["Xpress Wallet", "Mobile money / fintech", "#2257A6"],

  // Digital banks, finance apps and fintech wallets
  ["Carbon", "Digital finance / fintech", "#22A65A"],
  ["FairMoney", "Digital finance / fintech", "#1859C9"],
  ["Kuda Bank", "Digital bank / MFB", "#40196D"],
  ["Moniepoint", "Digital bank / MFB", "#246BFD"],
  ["Nomba", "Digital finance / fintech", "#5A35D6"],
  ["Renmoney", "Digital finance / MFB", "#F05A28"],
  ["Rubies Bank", "Digital bank / MFB", "#8C2B8F"],
  ["Sparkle", "Digital bank / MFB", "#7B2CBF"],
  ["VBank by VFD Microfinance Bank", "Digital bank / MFB", "#252B42"],
  ["Mintyn by Finex Microfinance Bank", "Digital bank / MFB", "#10A37F"],
  ["Eyowo", "Digital finance / fintech", "#7A52CC"],
  ["Branch", "Digital finance / fintech", "#00A884"],
  ["Aella Credit", "Digital finance / fintech", "#2764C8"],
  ["Cowrywise", "Digital finance / fintech", "#0066F5"],
  ["PiggyVest", "Digital finance / fintech", "#0D60D8"],
  ["Risevest", "Digital finance / fintech", "#1565C0"],
  ["Bamboo", "Digital finance / fintech", "#0E9F6E"],
  ["Chipper Cash", "Digital finance / fintech", "#6C4CF1"],
  ["Leatherback", "Digital finance / fintech", "#2E4DA7"],
  ["LemFi", "Digital finance / fintech", "#00A86B"],

  // Microfinance banks commonly used for personal and business accounts
  ["AB Microfinance Bank", "Microfinance bank", "#315C83"],
  ["Accion Microfinance Bank", "Microfinance bank", "#E16B2D"],
  ["Addosser Microfinance Bank", "Microfinance bank", "#216D60"],
  ["Advans La Fayette Microfinance Bank", "Microfinance bank", "#2B67A0"],
  ["Alert Microfinance Bank", "Microfinance bank", "#B23A48"],
  ["Amju Unique Microfinance Bank", "Microfinance bank", "#456B8C"],
  ["Baobab Microfinance Bank", "Microfinance bank", "#68A83F"],
  ["BoI Microfinance Bank", "Microfinance bank", "#327A54"],
  ["Bosak Microfinance Bank", "Microfinance bank", "#9B673E"],
  ["Bowen Microfinance Bank", "Microfinance bank", "#386E91"],
  ["CEMCS Microfinance Bank", "Microfinance bank", "#4A6F8D"],
  ["CIT Microfinance Bank", "Microfinance bank", "#365D8C"],
  ["Consumer Microfinance Bank", "Microfinance bank", "#536B89"],
  ["Credit Afrique Microfinance Bank", "Microfinance bank", "#4E718D"],
  ["Davodani Microfinance Bank", "Microfinance bank", "#486983"],
  ["EdFin Microfinance Bank", "Microfinance bank", "#2F6C78"],
  ["Empire Trust Microfinance Bank", "Microfinance bank", "#79588F"],
  ["Fina Trust Microfinance Bank", "Microfinance bank", "#486A91"],
  ["Fortis Microfinance Bank", "Microfinance bank", "#436C8A"],
  ["Grooming Microfinance Bank", "Microfinance bank", "#375F82"],
  ["Hasal Microfinance Bank", "Microfinance bank", "#436D72"],
  ["Infinity Microfinance Bank", "Microfinance bank", "#467A85"],
  ["LAPO Microfinance Bank", "Microfinance bank", "#13874B"],
  ["Letshego Microfinance Bank", "Microfinance bank", "#E67E22"],
  ["Mainstreet Microfinance Bank", "Microfinance bank", "#2C6388"],
  ["Mutual Trust Microfinance Bank", "Microfinance bank", "#526D8B"],
  ["NPF Microfinance Bank", "Microfinance bank", "#1B6D4B"],
  ["Page Financials", "Microfinance bank", "#E05B32"],
  ["Petra Microfinance Bank", "Microfinance bank", "#5D698D"],
  ["Rehoboth Microfinance Bank", "Microfinance bank", "#4B7086"],
  ["Seedvest Microfinance Bank", "Microfinance bank", "#2D8062"],
  ["Shepherd Trust Microfinance Bank", "Microfinance bank", "#596E88"],
  ["Stanford Microfinance Bank", "Microfinance bank", "#4F6687"],
  ["TrustBanc Microfinance Bank", "Microfinance bank", "#315D7B"],
  ["VFD Microfinance Bank", "Microfinance bank", "#252B42"],
  ["Verite Microfinance Bank", "Microfinance bank", "#4B6F84"],
  ["Wetland Microfinance Bank", "Microfinance bank", "#347566"],

  // Primary mortgage banks
  ["Abbey Mortgage Bank", "Mortgage bank", "#236B7C"],
  ["AG Mortgage Bank", "Mortgage bank", "#4B6288"],
  ["Brent Mortgage Bank", "Mortgage bank", "#547184"],
  ["Delta Trust Mortgage Bank", "Mortgage bank", "#607F95"],
  ["Federal Mortgage Bank of Nigeria", "Mortgage bank", "#336A92"],
  ["First Generation Mortgage Bank", "Mortgage bank", "#507690"],
  ["Gateway Mortgage Bank", "Mortgage bank", "#51738B"],
  ["Haggai Mortgage Bank", "Mortgage bank", "#586B87"],
  ["Infinity Trust Mortgage Bank", "Mortgage bank", "#3D7185"],
  ["Jubilee-Life Mortgage Bank", "Mortgage bank", "#597D8A"],
  ["Lagos Building Investment Company", "Mortgage bank", "#587C91"],
  ["LivingTrust Mortgage Bank", "Mortgage bank", "#447F78"],
  ["Mutual Alliance Mortgage Bank", "Mortgage bank", "#60718C"],
  ["Nigeria Police Mortgage Bank", "Mortgage bank", "#446B84"],
  ["Platinum Mortgage Bank", "Mortgage bank", "#4D7193"],
  ["Refuge Mortgage Bank", "Mortgage bank", "#4D7886"],
  ["Safetrust Mortgage Bank", "Mortgage bank", "#447887"],
  ["Trustbond Mortgage Bank", "Mortgage bank", "#496F8C"],
].map(([name, category, color]) => ({ name, category, color }));

const SWATCHES = [
  "#174E78",
  "#2DD4BF",
  "#7C6FF0",
  "#cc4b8e",
  "#8f3863",
  "#FBBF24",
  "#16A34A",
  "#F59E0B",
  "#3B82F6",
  "#b10c0c",
  "#0EA5E9",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#84CC16",
];

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

  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankSyncLoading, setBankSyncLoading] = useState(false);
  const [bankSyncMessage, setBankSyncMessage] = useState("");
  const [refreshingBankId, setRefreshingBankId] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);

  const [editingAccount, setEditingAccount] = useState(null);

  const [accountName, setAccountName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [initialAmount, setInitialAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [accountColor, setAccountColor] = useState(SWATCHES[0]);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const totalAccountBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0,
  );

  const totalCurrency =
    currentUser?.currency ||
    currentUser?.base_currency ||
    accounts[0]?.currency ||
    "NGN";

  const getCurrencySymbol = (code) => {
    try {
      const formatted = formatCurrency(0, code);

      const symbol = formatted.replace(/[\d\s.,-]/g, "").trim();

      return symbol || code;
    } catch (error) {
      return code;
    }
  };

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

  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
      loadBankAccounts();
      loadCurrentUser();
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
    Alert.alert("Coming Soon", "Direct bank synchronization is coming soon");
  };

  const [importMode, setImportMode] = useState(null);
  const [importAccountId, setImportAccountId] = useState("");
  const [importBank, setImportBank] = useState("");
  const [manualBank, setManualBank] = useState("");
  const [manualBankSearch, setManualBankSearch] = useState("");
  const [showManualBankPicker, setShowManualBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [selectedStatementFile, setSelectedStatementFile] = useState(null);
  const [emailText, setEmailText] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importTypeSelections, setImportTypeSelections] = useState({});
  const [openTypeDropdownIndex, setOpenTypeDropdownIndex] = useState(null);

  const openImport = (mode) => {
    setShowAddModal(false);
    setImportAccountId("");
    setImportBank("");
    setBankSearch("");
    setShowBankPicker(false);
    setShowAccountPicker(false);
    setSelectedStatementFile(null);
    setEmailText("");
    setImportPreview(null);
    setImportTypeSelections({});
    setOpenTypeDropdownIndex(null);
    setImportMode(mode);
  };

  const handleChooseStatementFile = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/octet-stream",
        ],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.length) return;
      setSelectedStatementFile(picked.assets[0]);
      setImportPreview(null);
      setImportTypeSelections({});
      setOpenTypeDropdownIndex(null);
    } catch (error) {
      Alert.alert(
        "File selection failed",
        error?.message || "Please choose the statement file again.",
      );
    }
  };

  const handlePreviewImport = async () => {
    if (!importBank) {
      Alert.alert(
        "Select bank",
        "Choose the Nigerian bank that issued the statement or email alert.",
      );
      return;
    }
    if (importMode === "statement" && !importAccountId) {
      Alert.alert(
        "Select account",
        "Choose an existing BudgetIQ account to import into.",
      );
      return;
    }
    if (importMode === "statement" && !selectedStatementFile) {
      Alert.alert(
        "Select statement",
        "Choose a bank statement file (PDF, CSV or Excel) to import.",
      );
      return;
    }
    try {
      setImportBusy(true);
      const result =
        importMode === "statement"
          ? await previewStatement(
              importAccountId,
              selectedStatementFile,
              importBank,
            )
          : await previewEmailAlerts(emailText, importBank);
      if (result) {
        setImportPreview(result);
        setImportTypeSelections({});
        setOpenTypeDropdownIndex(null);
      }
    } catch (error) {
      Alert.alert(
        "Import preview failed",
        error?.error ||
          error?.message ||
          "Please check the file or email alert text.",
      );
    } finally {
      setImportBusy(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.importId) return;

    const unresolved = (importPreview.transactions || [])
      .map((item, index) => ({
        item,
        index,
        type: importTypeSelections[index],
      }))
      .filter(({ item }) => importMode === "email" && item.needsReview);

    if (unresolved.some(({ type }) => !type)) {
      Alert.alert(
        "Select transaction type",
        "Choose Debit (Expense) or Credit (Income) for every transaction that needs review.",
      );
      return;
    }

    try {
      setImportBusy(true);

      if (unresolved.length) {
        const updatedPreview = await updateEmailTypes(
          importPreview.importId,
          unresolved.map(({ index, type }) => ({ index, type })),
        );

        setImportPreview((current) => ({
          ...current,
          ...updatedPreview,
        }));
      }

      const result = await confirmImport(importPreview.importId);
      Alert.alert(
        "Import complete",
        `${result.imported || 0} transaction(s) imported. ${result.skipped || 0} skipped.`,
      );
      setImportMode(null);
      setImportPreview(null);
      setImportTypeSelections({});
      setOpenTypeDropdownIndex(null);
      await loadAccounts();
    } catch (error) {
      Alert.alert(
        "Import failed",
        error?.error || error?.message || "Unable to import transactions.",
      );
    } finally {
      setImportBusy(false);
    }
  };

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

  const resetForm = () => {
    setEditingAccount(null);
    setAccountName("");
    setManualBank("");
    setShowManualBankPicker(false);
    setManualBankSearch("");
    setCurrency("NGN");
    setInitialAmount("");
    setNotes("");
    setAccountColor(SWATCHES[0]);
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
    setManualBank(
      account.bank_name ||
        NIGERIAN_BANKS.find((bank) => bank.name === account.name)?.name ||
        "",
    );

    setCurrency(account.currency || "NGN");

    setInitialAmount(String(account.balance ?? ""));

    setNotes(account.notes || "");

    setAccountColor(account.color || SWATCHES[0]);

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
      Alert.alert("Missing account name", "Please enter an account name.");

      return;
    }

    // Allow a new wallet/account to be created with a zero balance.
    // If the field is left blank, treat it as 0.00.
    const amount = initialAmount.trim() === "" ? 0 : Number(initialAmount);

    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert("Invalid amount", "Please enter a valid initial amount.");

      return;
    }

    try {
      setSavingAccount(true);

      const accountData = {
        name: accountName.trim(),
        bankName: manualBank || null,
        currency,
        initialAmount: amount,
        notes: notes.trim() || null,
        color: accountColor,
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
          color: accountData.color,
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
        style={styles.scrollView}
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

          <View style={styles.headerActions}>
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

            <View
              style={[
                styles.totalBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.totalLabel, { color: colors.textFaint }]}>
                Total balance
              </Text>

              <Text
                style={[styles.totalValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {accountsLoading
                  ? "—"
                  : formatCurrency(totalAccountBalance, totalCurrency)}
              </Text>
            </View>
          </View>
        </View>

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
                        backgroundColor: account.color || colors.chipBg,
                      },
                    ]}
                  >
                    {!account.color && (
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
                    )}
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

      <AdBanner />

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

            {[
              {
                mode: "statement",
                title: "Import Bank Statement",
                detail:
                  "Import PDF, CSV or Excel transactions into an existing account.",
                icon: "⇩",
              },
              {
                mode: "email",
                title: "Email Sync",
                detail:
                  "Import bank transaction alerts you explicitly provide. Automatic inbox connection is not enabled.",
                icon: "✉",
              },
            ].map((option) => (
              <Pressable
                key={option.mode}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  openImport(option.mode);
                }}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.chipBg },
                  ]}
                >
                  <Text
                    style={[styles.optionIconText, { color: colors.primary }]}
                  >
                    {option.icon}
                  </Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textFaint },
                    ]}
                  >
                    {option.detail}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: colors.textFaint }]}>
                  ›
                </Text>
              </Pressable>
            ))}

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

      <Modal
        visible={!!importMode}
        transparent
        animationType="slide"
        onRequestClose={() => !importBusy && setImportMode(null)}
      >
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {importMode === "statement"
                      ? "Import Bank Statement"
                      : "Email Alert Import"}
                  </Text>
                  <Text
                    style={[styles.modalSubtitle, { color: colors.textFaint }]}
                  >
                    {importMode === "statement"
                      ? "Choose the issuing bank and an existing BudgetIQ account, then upload your statement."
                      : "Choose the issuing bank and paste transaction alerts you explicitly provide."}
                  </Text>
                </View>
                <Pressable
                  disabled={importBusy}
                  onPress={() => setImportMode(null)}
                  hitSlop={10}
                >
                  <Text
                    style={[styles.closeButton, { color: colors.textFaint }]}
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.textMuted, marginBottom: 12 },
                ]}
              >
                Review all detected entries before confirming. Never enter your
                email password or bank password.
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                1. Select Nigerian bank
              </Text>
              <Pressable
                disabled={importBusy}
                onPress={() => setShowBankPicker((value) => !value)}
                style={[
                  styles.selectInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.inputBorder,
                    marginBottom: 8,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor:
                        NIGERIAN_BANKS.find((bank) => bank.name === importBank)
                          ?.color || colors.chipBg,
                    }}
                  />
                  <Text style={[styles.selectText, { color: colors.text }]}>
                    {importBank || "Choose your bank"}
                  </Text>
                </View>
                <Text style={{ color: colors.textFaint }}>
                  {showBankPicker ? "⌃" : "⌄"}
                </Text>
              </Pressable>
              {showBankPicker && (
                <View
                  style={[
                    styles.currencyDropdown,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      marginBottom: 10,
                    },
                  ]}
                >
                  <TextInput
                    value={bankSearch}
                    onChangeText={setBankSearch}
                    placeholder="Search Nigerian banks..."
                    placeholderTextColor={colors.textFaint}
                    style={[
                      styles.textInput,
                      {
                        color: colors.text,
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.background,
                        margin: 8,
                      },
                    ]}
                  />
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 205 }}
                  >
                    {NIGERIAN_BANKS.filter((bank) => {
                      const search = bankSearch.trim().toLowerCase();
                      return (
                        bank.name.toLowerCase().includes(search) ||
                        bank.category.toLowerCase().includes(search)
                      );
                    }).map((bank) => (
                      <Pressable
                        key={bank.name}
                        onPress={() => {
                          setImportBank(bank.name);
                          setBankSearch("");
                          setShowBankPicker(false);
                          setImportPreview(null);
                          setImportTypeSelections({});
                          setOpenTypeDropdownIndex(null);
                        }}
                        style={[
                          styles.currencyOption,
                          { borderBottomColor: colors.divider },
                        ]}
                      >
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: bank.color,
                            marginRight: 10,
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.optionTitle, { color: colors.text }]}
                          >
                            {importBank === bank.name ? "● " : ""}
                            {bank.name}
                          </Text>
                          <Text
                            style={[
                              styles.optionDescription,
                              { color: colors.textFaint },
                            ]}
                          >
                            {bank.category}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {importMode === "statement" && (
                <>
                  <Text
                    style={[styles.inputLabel, { color: colors.textMuted }]}
                  >
                    2. Choose from accounts on your Account page
                  </Text>
                  {accounts.length === 0 ? (
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.textMuted, marginBottom: 8 },
                      ]}
                    >
                      No accounts added yet. Choose New Account from the + Add
                      account menu, then return here.
                    </Text>
                  ) : (
                    <>
                      <Pressable
                        disabled={importBusy}
                        onPress={() => setShowAccountPicker((value) => !value)}
                        style={[
                          styles.selectInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.inputBorder,
                            marginBottom: 8,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.selectText, { color: colors.text }]}
                        >
                          {importAccountId
                            ? (() => {
                                const selected = accounts.find(
                                  (account) =>
                                    String(account.id) === importAccountId,
                                );
                                return selected
                                  ? `${selected.name} · ${selected.currency}`
                                  : "Choose account";
                              })()
                            : "Choose account"}
                        </Text>
                        <Text style={{ color: colors.textFaint }}>
                          {showAccountPicker ? "⌃" : "⌄"}
                        </Text>
                      </Pressable>
                      {showAccountPicker && (
                        <View
                          style={[
                            styles.currencyDropdown,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.cardBorder,
                              marginBottom: 10,
                            },
                          ]}
                        >
                          <ScrollView
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            style={{ maxHeight: 190 }}
                          >
                            {accounts.map((account) => (
                              <Pressable
                                key={account.id}
                                onPress={() => {
                                  setImportAccountId(String(account.id));
                                  setShowAccountPicker(false);
                                  setImportPreview(null);
                                  setImportTypeSelections({});
                                  setOpenTypeDropdownIndex(null);
                                }}
                                style={[
                                  styles.currencyOption,
                                  { borderBottomColor: colors.divider },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.optionTitle,
                                    { color: colors.text, flex: 1 },
                                  ]}
                                >
                                  {String(account.id) === importAccountId
                                    ? "● "
                                    : ""}
                                  {account.name} · {account.currency}
                                </Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: colors.textMuted }]}
                  >
                    3. Select bank statement
                  </Text>
                  <Pressable
                    disabled={importBusy}
                    onPress={handleChooseStatementFile}
                    style={[
                      styles.selectInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.inputBorder,
                        marginBottom: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: colors.primary, marginBottom: 0 },
                      ]}
                    >
                      Choose File
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.selectText,
                        {
                          color: colors.textFaint,
                          flexShrink: 1,
                          marginLeft: 10,
                        },
                      ]}
                    >
                      {selectedStatementFile?.name || "No file chosen"}
                    </Text>
                  </Pressable>
                </>
              )}

              {importMode === "email" && (
                <>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textMuted, marginBottom: 8 },
                    ]}
                  >
                    A matching bank account will be used or created
                    automatically when you confirm. Automatic inbox access is
                    not enabled.
                  </Text>
                  <Text
                    style={[styles.inputLabel, { color: colors.textMuted }]}
                  >
                    2. Paste bank transaction alerts
                  </Text>
                  <TextInput
                    multiline
                    value={emailText}
                    onChangeText={(value) => {
                      setEmailText(value);
                      setImportPreview(null);
                      setImportTypeSelections({});
                      setOpenTypeDropdownIndex(null);
                    }}
                    placeholder="Paste one or more bank transaction alert messages here..."
                    placeholderTextColor={colors.textFaint}
                    style={[
                      styles.notesInput,
                      {
                        minHeight: 130,
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.inputBorder,
                      },
                    ]}
                  />
                </>
              )}
              {importPreview ? (
                <View>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: colors.text, marginVertical: 12 },
                    ]}
                  >
                    Review import:{" "}
                    {importPreview.count ||
                      importPreview.transactions?.length ||
                      0}{" "}
                    transaction(s)
                  </Text>
                  {(importPreview.transactions || [])
                    .slice(0, 30)
                    .map((item, index) => {
                      const isEmailReview =
                        importMode === "email" && item.needsReview;
                      const selectedType = importTypeSelections[index];

                      return (
                        <View
                          key={index}
                          style={[
                            styles.optionCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.cardBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.optionTitle, { color: colors.text }]}
                          >
                            {item.type
                              ? `${item.type === "expense" ? "Debit (Expense)" : "Credit (Income)"} · `
                              : ""}
                            {item.amount} · {item.occurred_on || item.date}
                          </Text>

                          {isEmailReview && (
                            <View style={{ marginTop: 8 }}>
                              <Text
                                style={[
                                  styles.inputLabel,
                                  {
                                    color: colors.textMuted,
                                    marginTop: 0,
                                    marginBottom: 6,
                                  },
                                ]}
                              >
                                Transaction type
                              </Text>

                              <Pressable
                                onPress={() =>
                                  setOpenTypeDropdownIndex((current) =>
                                    current === index ? null : index,
                                  )
                                }
                                style={[
                                  styles.selectInput,
                                  {
                                    backgroundColor: colors.background,
                                    borderColor: colors.inputBorder,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.selectText,
                                    {
                                      color: selectedType
                                        ? colors.text
                                        : colors.textFaint,
                                    },
                                  ]}
                                >
                                  {selectedType
                                    ? selectedType === "expense"
                                      ? "Debit (Expense)"
                                      : "Credit (Income)"
                                    : "Choose transaction type"}
                                </Text>
                                <Text style={{ color: colors.textFaint }}>
                                  {openTypeDropdownIndex === index ? "⌃" : "⌄"}
                                </Text>
                              </Pressable>

                              {openTypeDropdownIndex === index && (
                                <View
                                  style={[
                                    styles.currencyDropdown,
                                    {
                                      backgroundColor: colors.card,
                                      borderColor: colors.cardBorder,
                                      marginTop: 5,
                                    },
                                  ]}
                                >
                                  {[
                                    {
                                      value: "expense",
                                      label: "Debit (Expense)",
                                    },
                                    {
                                      value: "income",
                                      label: "Credit (Income)",
                                    },
                                  ].map((option) => (
                                    <Pressable
                                      key={option.value}
                                      onPress={() => {
                                        setImportTypeSelections((current) => ({
                                          ...current,
                                          [index]: option.value,
                                        }));
                                        setOpenTypeDropdownIndex(null);
                                      }}
                                      style={[
                                        styles.currencyOption,
                                        { borderBottomColor: colors.divider },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.optionTitle,
                                          { color: colors.text, flex: 1 },
                                        ]}
                                      >
                                        {selectedType === option.value
                                          ? "● "
                                          : ""}
                                        {option.label}
                                      </Text>
                                    </Pressable>
                                  ))}
                                </View>
                              )}
                            </View>
                          )}

                          <Text
                            style={[
                              styles.optionDescription,
                              { color: colors.textMuted, marginTop: 8 },
                            ]}
                          >
                            {item.description}
                          </Text>
                        </View>
                      );
                    })}
                  {!!importPreview.warnings?.length && (
                    <Text style={{ color: colors.textMuted }}>
                      {importPreview.warnings.join("\n")}
                    </Text>
                  )}
                  <Pressable
                    disabled={
                      importBusy ||
                      !importPreview.transactions?.length ||
                      (importMode === "email" &&
                        importPreview.transactions.some(
                          (item, index) =>
                            item.needsReview && !importTypeSelections[index],
                        ))
                    }
                    onPress={handleConfirmImport}
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor: colors.primary,
                        opacity:
                          importBusy ||
                          !importPreview.transactions?.length ||
                          (importMode === "email" &&
                            importPreview.transactions.some(
                              (item, index) =>
                                item.needsReview &&
                                !importTypeSelections[index],
                            ))
                            ? 0.5
                            : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.saveButtonText,
                        { color: colors.primaryText },
                      ]}
                    >
                      {importBusy ? "Importing..." : "Confirm import"}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={importBusy}
                    onPress={() => {
                      setImportPreview(null);
                      setImportTypeSelections({});
                      setOpenTypeDropdownIndex(null);
                    }}
                    style={styles.cancelButton}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: colors.text }]}
                    >
                      Back
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  disabled={
                    importBusy ||
                    !importBank ||
                    (importMode === "statement" &&
                      (!importAccountId || !selectedStatementFile)) ||
                    (importMode === "email" && !emailText.trim())
                  }
                  onPress={handlePreviewImport}
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: importBusy ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: colors.primaryText },
                    ]}
                  >
                    {importBusy
                      ? "Preparing preview..."
                      : importMode === "statement"
                        ? "Preview statement"
                        : "Preview alerts"}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              Choose Nigerian bank (optional)
            </Text>
            <Pressable
              disabled={savingAccount}
              onPress={() => setShowManualBankPicker((value) => !value)}
              style={[
                styles.selectInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.inputBorder,
                  marginBottom: 8,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor:
                      NIGERIAN_BANKS.find((bank) => bank.name === manualBank)
                        ?.color || colors.chipBg,
                  }}
                />
                <Text
                  style={[
                    styles.selectText,
                    { color: colors.text, flexShrink: 1 },
                  ]}
                >
                  {manualBank || "Select bank or leave blank for wallet/cash"}
                </Text>
              </View>
              <Text style={{ color: colors.textFaint }}>⌄</Text>
            </Pressable>
            {showManualBankPicker && (
              <View
                style={[
                  styles.currencyDropdown,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <TextInput
                  value={manualBankSearch}
                  onChangeText={setManualBankSearch}
                  placeholder="Search Nigerian banks..."
                  placeholderTextColor={colors.textFaint}
                  style={[
                    styles.textInput,
                    {
                      color: colors.text,
                      borderColor: colors.inputBorder,
                      backgroundColor: colors.background,
                      margin: 8,
                    },
                  ]}
                />
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 190 }}
                >
                  <Pressable
                    onPress={() => {
                      setManualBank("");
                      setShowManualBankPicker(false);
                    }}
                    style={[
                      styles.currencyOption,
                      { borderBottomColor: colors.divider },
                    ]}
                  >
                    <Text style={{ color: colors.text }}>
                      No bank / wallet / cash
                    </Text>
                  </Pressable>
                  {NIGERIAN_BANKS.filter((bank) => {
                    const search = manualBankSearch.trim().toLowerCase();
                    return (
                      bank.name.toLowerCase().includes(search) ||
                      bank.category.toLowerCase().includes(search)
                    );
                  }).map((bank) => (
                    <Pressable
                      key={bank.name}
                      onPress={() => {
                        setManualBank(bank.name);
                        if (!accountName.trim()) setAccountName(bank.name);
                        setAccountColor(bank.color);
                        setManualBankSearch("");
                        setShowManualBankPicker(false);
                      }}
                      style={[
                        styles.currencyOption,
                        { borderBottomColor: colors.divider },
                      ]}
                    >
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: bank.color,
                          marginRight: 10,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.optionTitle, { color: colors.text }]}
                        >
                          {bank.name}
                        </Text>
                        <Text
                          style={[
                            styles.optionDescription,
                            { color: colors.textFaint },
                          ]}
                        >
                          {bank.category}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
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
              Account color
            </Text>

            <View style={styles.colorPreviewRow}>
              <View
                style={[
                  styles.colorPreviewCircle,
                  {
                    backgroundColor: accountColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.colorPreviewText,
                  {
                    color: colors.textFaint,
                  },
                ]}
              >
                This color shows on the account card{" "}
                {accountName.trim() ? `for "${accountName.trim()}"` : ""}
              </Text>
            </View>

            <View style={styles.swatchRow}>
              {SWATCHES.map((swatch) => {
                const isSelected = accountColor === swatch;

                return (
                  <Pressable
                    key={swatch}
                    onPress={() => setAccountColor(swatch)}
                    disabled={savingAccount}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: swatch,
                      },
                      isSelected && {
                        borderColor: colors.text,
                      },
                    ]}
                  />
                );
              })}
            </View>

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

  scrollView: {
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

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 15,
  },

  totalBox: {
    flexShrink: 1,
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  totalLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },

  totalValue: {
    fontSize: 12,
    fontFamily: "JetBrainsMono_500Medium",
    marginTop: 1,
  },

  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  addButtonText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

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
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  accountCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  accountIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
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

  colorPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  colorPreviewCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  colorPreviewText: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    lineHeight: 13,
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
