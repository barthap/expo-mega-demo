import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import PlayerScreen from "./screens/PlayerScreen";
import BluetoothScreen from "./screens/BluetoothScreen";
import {
  BottomNavigation,
  BottomNavigationTab,
  Icon,
  TopNavigation,
  Divider,
} from "@ui-kitten/components";
import RGBControlScreen from "./screens/RGBControlScreen";

const Tab = createBottomTabNavigator();

const BottomTabBar = ({
  navigation,
  state,
  descriptors,
}: BottomTabBarProps) => (
  <BottomNavigation
    style={styles.bottomNavigation}
    selectedIndex={state.index}
    onSelect={(index) => navigation.navigate(state.routeNames[index])}
  >
    {state.routes.map((route) => {
      return (
        <BottomNavigationTab
          key={route.key}
          title={route.name}
          // @ts-expect-error UI-Kitten passed, but typings are from react-navigation
          icon={(props) =>
            descriptors[route.key].options.tabBarIcon?.(props as any) ?? null
          }
        />
      );
    })}
  </BottomNavigation>
);

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{
          header: (props) => (
            <>
              <TopNavigation
                title={props.route.name}
                alignment="center"
                // @ts-expect-error Put the UI kitten header components instead
                accessoryRight={props.options.headerRight}
              />
              <Divider />
            </>
          ),
        }}
      >
        <Tab.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            tabBarIcon: (props) => <Icon name="music-outline" {...props} />,
          }}
        />
        <Tab.Screen
          name="RGB"
          component={RGBControlScreen}
          options={{
            tabBarIcon: (props) => (
              <Icon name="color-palette-outline" {...props} />
            ),
          }}
        />
        <Tab.Screen
          name="Bluetooth"
          component={BluetoothScreen}
          options={{
            tabBarIcon: (props) => <Icon name="bluetooth-outline" {...props} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    marginBottom: 0,
  },
});
