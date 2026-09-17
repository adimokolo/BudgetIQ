import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { formatCurrency, currencySymbolFor } from "../utils/currency";
import { updateBaseCurrencyOnServer } from "../services/profile";

const BASE_CURRENCY_STORAGE_KEY = "base_currency";
const DEFAULT_CURRENCY = "NGN";

const CurrencyContext = createContext({
  baseCurrency: DEFAULT_CURRENCY,
  currencyReady: false,
  setBaseCurrency: async () => {},
  hydrateBaseCurrency: (_code) => {},
  formatAmount: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
  currencySymbol: currencySymbolFor(DEFAULT_CURRENCY),
});

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrencyState] = useState(DEFAULT_CURRENCY);
  const [currencyReady, setCurrencyReady] = useState(false);

  const knownServerCurrency = useRef(null);

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

  const setBaseCurrency = useCallback(
    async (code) => {
      const previousCurrency = baseCurrency;

      setBaseCurrencyState(code);

      try {
        await AsyncStorage.setItem(BASE_CURRENCY_STORAGE_KEY, code);
        await updateBaseCurrencyOnServer(code);

        knownServerCurrency.current = code;
      } catch (error) {
        console.log("Failed to persist base currency:", error);

        setBaseCurrencyState(previousCurrency);

        try {
          await AsyncStorage.setItem(
            BASE_CURRENCY_STORAGE_KEY,
            previousCurrency,
          );
        } catch (storageError) {
          console.log(
            "Failed to roll back stored base currency:",
            storageError,
          );
        }

        throw error;
      }
    },
    [baseCurrency],
  );

  const hydrateBaseCurrency = useCallback((code) => {
    if (!code) {
      return;
    }

    if (knownServerCurrency.current === code) {
      return;
    }

    knownServerCurrency.current = code;
    setBaseCurrencyState(code);

    AsyncStorage.setItem(BASE_CURRENCY_STORAGE_KEY, code).catch((error) => {
      console.log("Failed to persist hydrated base currency:", error);
    });
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
      hydrateBaseCurrency,
      formatAmount,
      currencySymbol: currencySymbolFor(baseCurrency),
    }),
    [
      baseCurrency,
      currencyReady,
      setBaseCurrency,
      hydrateBaseCurrency,
      formatAmount,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
