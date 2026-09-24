import React from "react";
import { View, StyleSheet } from "react-native";
import {
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";

import { getBannerAdUnitId } from "../config/ads";

export default function AdBanner() {
  const adUnitId = getBannerAdUnitId();

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
