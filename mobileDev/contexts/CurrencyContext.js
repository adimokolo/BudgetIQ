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

import { getCurrentUser } from "../services/auth";

const BASE_CURRENCY_STORAGE_KEY = "base_currency";
const DEFAULT_CURRENCY = "NGN";

const CurrencyContext = createContext({
  baseCurrency: DEFAULT_CURRENCY,
  currencyReady: false,
  setBaseCurrency: async () => {},
  formatAmount: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
  currencySymbol: currencySymbolFor(DEFAULT_CURRENCY),
});

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrencyState] = useState(DEFAULT_CURRENCY);

  const [currencyReady, setCurrencyReady] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD CURRENCY
  |--------------------------------------------------------------------------
  |
  | Local storage gives us a fast value.
  |
  | The user's profile is then checked so the currency selected during
  | registration remains the source of truth.
  |
  */

  useEffect(() => {
    let mounted = true;

    const loadCurrency = async () => {
      try {
        /*
        |--------------------------------------------------------------------------
        | 1. LOAD LOCAL CACHED CURRENCY
        |--------------------------------------------------------------------------
        */

        const storedCurrency = await AsyncStorage.getItem(
          BASE_CURRENCY_STORAGE_KEY,
        );

        if (mounted && storedCurrency && typeof storedCurrency === "string") {
          setBaseCurrencyState(storedCurrency.toUpperCase());
        }

        /*
        |--------------------------------------------------------------------------
        | 2. LOAD USER PROFILE
        |--------------------------------------------------------------------------
        |
        | This checks the currency saved to the user's account.
        |
        */

        try {
          const data = await getCurrentUser();

          const profile = data?.user || data?.data?.user || data?.data || data;

          const profileCurrency =
            profile?.currency ||
            profile?.base_currency ||
            profile?.baseCurrency ||
            null;

          if (
            mounted &&
            profileCurrency &&
            typeof profileCurrency === "string"
          ) {
            const normalizedCurrency = profileCurrency.toUpperCase();

            setBaseCurrencyState(normalizedCurrency);

            /*
            |--------------------------------------------------------------------------
            | 3. KEEP LOCAL STORAGE IN SYNC
            |--------------------------------------------------------------------------
            */

            await AsyncStorage.setItem(
              BASE_CURRENCY_STORAGE_KEY,
              normalizedCurrency,
            );
          }
        } catch (profileError) {
          /*
          |--------------------------------------------------------------------------
          | PROFILE FAILURE
          |--------------------------------------------------------------------------
          |
          | If the profile request fails, continue using the locally cached
          | currency instead of breaking the application.
          |
          */

          console.log(
            "Failed to load user currency from profile:",
            profileError?.response?.data ||
              profileError?.message ||
              profileError,
          );
        }
      } catch (error) {
        console.log("Failed to load stored base currency:", error);
      } finally {
        if (mounted) {
          setCurrencyReady(true);
        }
      }
    };

    loadCurrency();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SET BASE CURRENCY
  |--------------------------------------------------------------------------
  |
  | Call this when the user changes their currency from Settings.
  |
  */

  const setBaseCurrency = useCallback(async (code) => {
    if (!code) {
      return;
    }

    const normalizedCode = String(code).toUpperCase();

    /*
      |--------------------------------------------------------------------------
      | UPDATE UI IMMEDIATELY
      |--------------------------------------------------------------------------
      */

    setBaseCurrencyState(normalizedCode);

    /*
      |--------------------------------------------------------------------------
      | SAVE LOCALLY
      |--------------------------------------------------------------------------
      */

    try {
      await AsyncStorage.setItem(BASE_CURRENCY_STORAGE_KEY, normalizedCode);
    } catch (error) {
      console.log("Failed to persist base currency:", error);
    }

    /*
      |--------------------------------------------------------------------------
      | BACKEND
      |--------------------------------------------------------------------------
      |
      | Do not add a backend update here until we confirm the exact
      | update-profile function used by your application.
      |
      */
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FORMAT AMOUNT
  |--------------------------------------------------------------------------
  */

  const formatAmount = useCallback(
    (amount) => formatCurrency(amount, baseCurrency),
    [baseCurrency],
  );

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

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
*/

export function useCurrency() {
  return useContext(CurrencyContext);
}
