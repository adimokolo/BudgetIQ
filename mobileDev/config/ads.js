import { TestIds } from "react-native-google-mobile-ads";

/*
|--------------------------------------------------------------------------
| BudgetIQ - Google AdMob Configuration
|--------------------------------------------------------------------------
|
| CURRENT MODE: TESTING
|
| We are temporarily forcing Google's official test banner ad so that
| BudgetIQ can display ads in:
|
| - Expo development builds
| - EAS preview builds
| - Android emulator
| - Android physical devices
|
| We are NOT using the real BudgetIQ AdMob banner ID yet.
|
| Once the test banner works correctly, this file will be updated so:
|
| Development -> Google Test Ads
| Preview     -> Google Test Ads
| Production  -> Real BudgetIQ Ads
|
|--------------------------------------------------------------------------
*/

/**
 * Return the AdMob banner ad unit ID that BudgetIQ should use.
 *
 * For now we always return Google's official adaptive banner
 * test ID.
 */
export const getBannerAdUnitId = () => {
  return TestIds.ADAPTIVE_BANNER;
};

/**
 * Indicates whether BudgetIQ is currently configured
 * to serve real production advertisements.
 *
 * Keep this false while testing.
 */
export const ENABLE_PRODUCTION_ADS = false;
