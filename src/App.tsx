import React from "react";
import Navigation from "./Navigation";

import * as eva from "@eva-design/eva";
import {
  ApplicationProvider,
  IconRegistry,
  useTheme,
} from "@ui-kitten/components";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { default as theme } from "../assets/custom-theme.json";

function ThemedSafeArea(props) {
  const theme = useTheme();
  return (
    <SafeAreaView
      {...props}
      style={[
        props.style,
        { backgroundColor: theme["background-basic-color-1"] },
      ]}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <IconRegistry icons={EvaIconsPack} />
      <StatusBar style="dark" />
      <ApplicationProvider {...eva} theme={{ ...eva.dark, ...theme }}>
        <ThemedSafeArea style={{ flex: 1 }}>
          <Navigation />
        </ThemedSafeArea>
      </ApplicationProvider>
    </SafeAreaProvider>
  );
}
