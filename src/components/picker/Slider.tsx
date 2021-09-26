import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Value,
  diffClamp,
  divide,
  set,
  useCode,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";
import { clamp } from "react-native-redash";

const { width } = Dimensions.get("window");
const SIZE = 30;
const upperBound = width - SIZE;
const styles = StyleSheet.create({
  container: {
    borderRadius: SIZE / 2,
  },
  cursor: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "white",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SIZE / 2,
  },
});

interface SliderProps {
  v: SharedValue<number>;
  bg1: SharedValue<number>;
  bg2: SharedValue<number>;
  onGestureEnd?: () => void;
}

export default ({ v, bg1, bg2, onGestureEnd }: SliderProps) => {
  const translationX = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart(_, ctx: { start: number }) {
      ctx.start = translationX.value;
    },
    onActive(event, ctx) {
      const newX = ctx.start + event.translationX;

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
