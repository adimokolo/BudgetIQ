import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { formatCurrency, currencySymbolFor } from "../utils/currency";

const BASE_CURRENCY_STORAGE_KEY = "base_currency";
const DEFAULT_CURRENCY = "NGN";

const CurrencyContext = createContext({
  baseCurrency: DEFAULT_CURRENCY,
  currencyReady: false,
  setBaseCurrency: async () => {},
  formatAmount: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
  currencySymbol: currencySymbolFor(DEFAULT_CURRENCY),
});

/*
|--------------------------------------------------------------------------
| CURRENCY PROVIDER
|--------------------------------------------------------------------------
|
| Wrap the app (e.g. in app/_layout.js, alongside your ThemeProvider)
| with this so every screen shares the same base currency and updates
| the moment it changes - no per-screen AsyncStorage reads needed.
|
*/

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrencyState] = useState(DEFAULT_CURRENCY);
  const [currencyReady, setCurrencyReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BASE_CURRENCY_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setBaseCurrencyState(stored);
        }
      })
      .catch((error) => {
        console.log("Failed to read stored base currency:", error);
      })
      .finally(() => {
        setCurrencyReady(true);
      });
  }, []);

  const setBaseCurrency = useCallback(async (code) => {
    setBaseCurrencyState(code);

    try {
      await AsyncStorage.setItem(BASE_CURRENCY_STORAGE_KEY, code);
    } catch (error) {
      console.log("Failed to persist base currency:", error);
    }

    // TODO: if your backend tracks base currency per-user, sync it here,
    // e.g. await updateProfile({ base_currency: code });
  }, []);

  const formatAmount = useCallback(
    (amount) => formatCurrency(amount, baseCurrency),
    [baseCurrency],
  );

  const value = useMemo(
    () => ({
      baseCurrency,
      currencyReady,
      setBaseCurrency,
      formatAmount,
      currencySymbol: currencySymbolFor(baseCurrency),
    }),
    [baseCurrency, currencyReady, setBaseCurrency, formatAmount],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| USE CURRENCY
|--------------------------------------------------------------------------
|
| import { useCurrency } from "../contexts/CurrencyContext";
| const { baseCurrency, formatAmount, currencySymbol } = useCurrency();
|
| formatAmount(1234.5) -> "₦1,234.50" (using whatever the user picked)
|
*/

export function useCurrency() {
  return useContext(CurrencyContext);
}
