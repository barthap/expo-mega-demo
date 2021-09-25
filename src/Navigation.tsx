import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import PlayerScreen from "./screens/PlayerScreen";
import BluetoothScreen from "./screens/BluetoothScreen";

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Player" component={PlayerScreen} />
        <Tab.Screen name="Bluetooth" component={BluetoothScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
