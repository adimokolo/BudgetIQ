import React from "react";

import { View, Platform, StyleSheet } from "react-native";

import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// Your Google AdMob banner ad unit IDs.
// These are NOT your AdMob App IDs.

const AD_UNIT_IDS = {
  android: "ca-app-pub-1490675395669448/1102787466",

  ios: "ca-app-pub-1490675395669448/1314451169",
};

// Keep live ads disabled until the required
// consent, privacy and release setup is complete.

const ENABLE_LIVE_ADS = false;

export default function AdBanner() {
  const productionAdUnitId = Platform.select({
    android: AD_UNIT_IDS.android,
    ios: AD_UNIT_IDS.ios,
    default: null,
  });

  const adUnitId = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : ENABLE_LIVE_ADS
      ? productionAdUnitId
      : null;

  if (!adUnitId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log("BudgetIQ banner loaded successfully");
        }}
        onAdFailedToLoad={(error) => {
          console.log("BudgetIQ banner error:", error.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
});
