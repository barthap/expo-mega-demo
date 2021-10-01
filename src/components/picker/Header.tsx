import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  processColor,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { hsv2rgb } from "react-native-redash";
import { rgb2hex } from "./colorUtils";
import { CANVAS_SIZE } from "./Picker";

import Slider from "./Slider";

const BUTTON_SIZE = 35;
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  containerTop: {
    borderTopLeftRadius: BUTTON_SIZE / 2,
    borderTopRightRadius: BUTTON_SIZE / 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 8,
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});

interface HeaderProps {
  readonly backgroundColor: SharedValue<number>;
  h: SharedValue<number>;
  s: SharedValue<number>;
  v: SharedValue<number>;
  onGestureEnd?: () => void;
}

export default ({ backgroundColor, h, s, v, onGestureEnd }: HeaderProps) => {
  const fullySaturatedColor = useDerivedValue(() => {
    const { r, g, b } = hsv2rgb(h.value, s.value, 1);
    return processColor(rgb2hex(r, g, b));
  }, [h, s]);
  const fullySaturatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: fullySaturatedColor.value,
    };
  }, [fullySaturatedColor]);

  return (
    <View>
      <Animated.View style={[styles.containerTop, fullySaturatedStyle]}>
        <View style={styles.container}>
          <View style={styles.side}>
            <Animated.Text style={[styles.name]}>RGB LED Color</Animated.Text>
          </View>
        </View>
      </Animated.View>
      <Slider
        {...{
          v,
          bg1: backgroundColor,
          bg2: fullySaturatedColor,
          onGestureEnd,
          width: CANVAS_SIZE,
        }}
      />
    </View>
  );
};
