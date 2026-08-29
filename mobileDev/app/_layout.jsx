import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import SplashScreenView from "../components/SplashScreenView";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await new Promise((r) => setTimeout(r, 1500));
      setReady(true);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!ready) {
    return <SplashScreenView />;
  }

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
