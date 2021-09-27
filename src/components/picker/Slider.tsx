import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";
import { clamp } from "react-native-redash";

const KNOB_SIZE = 30;
const styles = StyleSheet.create({
  container: {
    borderRadius: KNOB_SIZE / 2,
  },
  cursor: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "white",
    borderColor: "#333",
    borderWidth: 1,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: KNOB_SIZE / 2,
  },
});

interface SliderProps {
  v: SharedValue<number>;
  bg1: SharedValue<number>;
  bg2: SharedValue<number>;
  onGestureEnd?: () => void;
  width: number;
}

export default ({ v, bg1, bg2, onGestureEnd, width }: SliderProps) => {
  const upperBound = width - KNOB_SIZE;
  const translationX = useSharedValue(upperBound);

  const gestureHandler = useAnimatedGestureHandler({
    onStart(_, ctx: { start: number }) {
      ctx.start = translationX.value;
    },
    onActive(event, ctx) {
      const newX = clamp(ctx.start + event.translationX, 0, upperBound);

      translationX.value = newX;
      v.value = translationX.value / upperBound;
    },
    onEnd: () => {
      runOnJS(onGestureEnd)();
    },
  });

  const bg1Style = useAnimatedStyle(
    () => ({ backgroundColor: bg1.value }),
    [bg1]
  );
  const bg2Style = useAnimatedStyle(
    () => ({ backgroundColor: bg2.value }),
    [bg2]
  );

  const sliderStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: translationX.value }],
    }),
    [translationX]
  );

  return (
    <View>
      <Animated.View style={[styles.background, bg2Style]} />
      <Animated.View style={[styles.container, bg1Style]}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.cursor, sliderStyle]} />
        </PanGestureHandler>
      </Animated.View>
    </View>
  );
};
