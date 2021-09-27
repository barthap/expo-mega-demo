/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  processColor,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

import Picker, { CANVAS_SIZE } from "./Picker";
import Header from "./Header";
import { hsv2rgb } from "react-native-redash";
import { HSV, RGB } from "colorsys";
import { rgb2hex } from "./colorUtils";
import ColorWheel from "./ColorWheel";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
  },
});

interface ColorChangeResult {
  rgb: RGB;
  hsv: HSV;
}

interface Props {
  onColorChange?: (result: ColorChangeResult) => void;
}
export default ({ onColorChange }: Props) => {
  const h = useSharedValue(0);
  const s = useSharedValue(0);
  const v = useSharedValue(1);
  const backgroundColor = useDerivedValue(() => {
    const { r, g, b } = hsv2rgb(h.value, s.value, v.value);
    return processColor(rgb2hex(r, g, b));
  }, [h, s, v]);

  const colorChanged = () => {
    // convert range (-0.5, 0.5) to (0, 360)
    const hue = h.value * 360;
    const hsv = {
      h: hue > 0 ? hue : 360 + hue,
      s: s.value * 100,
      v: v.value * 100,
    };
    const rgb = hsv2rgb(h.value, s.value, v.value);
    onColorChange?.({ rgb, hsv });
  };

  return (
    <View style={styles.container}>
      <ColorWheel
        canvasSize={CANVAS_SIZE}
        pickerComponent={
          <Picker {...{ h, s, backgroundColor }} onGestureEnd={colorChanged} />
        }
      />
      <Header {...{ backgroundColor, h, s, v }} onGestureEnd={colorChanged} />
    </View>
  );
};
