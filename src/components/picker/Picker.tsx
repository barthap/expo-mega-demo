/* eslint-disable max-len */
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path } from "react-native-svg";
import Animated, {
  pow,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  useAnimatedProps,
} from "react-native-reanimated";
import { canvas2Polar, clamp, polar2Canvas } from "react-native-redash";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const quadraticIn = (t: Animated.Node<number>) => pow(t, 2);
const { width } = Dimensions.get("window");
const PICKER_WIDTH = 30;
const PICKER_HEIGHT = (PICKER_WIDTH * 60) / 40;
const STROKE_WIDTH = 4;
export const CANVAS_SIZE = width - PICKER_WIDTH * 2;
const CENTER = {
  x: CANVAS_SIZE / 2,
  y: CANVAS_SIZE / 2,
};

interface PickerProps {
  h: SharedValue<number>;
  s: SharedValue<number>;
  readonly backgroundColor: SharedValue<number>;
  onGestureEnd?: () => void;
}

export default ({ h, s, onGestureEnd, backgroundColor }: PickerProps) => {
  const isPressed = useSharedValue(false);
  const offset = useSharedValue({ x: CENTER.x, y: CENTER.y });
  
  const pickerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offset.value.x - PICKER_WIDTH / 2 },
        { translateY: offset.value.y - PICKER_HEIGHT / 2 },
      ],
    };
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      fill: backgroundColor.value,
    };
  });

  const start = useSharedValue({ x: CENTER.x, y: CENTER.y });
  const gesture = Gesture.Pan()
      .onBegin(() => {
          isPressed.value = true;
      })
      .onUpdate((e) => {
          const newX = e.translationX + start.value.x;
          const newY = e.translationY + start.value.y;
          const polar = canvas2Polar({ x: newX, y: newY }, CENTER);
          const l = {
            theta: polar.theta,
            radius: clamp(polar.radius, 0, CANVAS_SIZE / 2),
          };
          const xy = polar2Canvas(l, CENTER);
          offset.value = {
            x: xy.x,
            y: xy.y,
          };
          const hue = (l.theta % (2 * Math.PI)) / (2 * Math.PI);
          const saturation = l.radius === 0 ? 0 : l.radius / (CANVAS_SIZE / 2);

          h.value = hue;
          s.value = saturation * saturation;
      })
      .onEnd(() => {
          start.value = {
            x: offset.value.x,
            y: offset.value.y,
          };
          runOnJS(onGestureEnd)();
      })
      .onFinalize(() => {
          isPressed.value = false;
      });


  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            {
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.58,
              shadowRadius: 16.0,
              elevation: 24,
            },
            pickerStyle,
          ]}
        >
          <Svg
            width={PICKER_WIDTH + STROKE_WIDTH * 2}
            height={PICKER_HEIGHT}
            style={{ top: -PICKER_HEIGHT / 2 }}
            viewBox={`-${STROKE_WIDTH / 2} -${STROKE_WIDTH / 2} ${
              44 + STROKE_WIDTH
            } ${60 + STROKE_WIDTH}`}
          >
            <AnimatedPath
              d="M22 .889C9.943.889.167 10.664.167 22.723.167 37.127 22 59.111 22 59.111S43.833 37.43 43.833 22.723C43.833 10.664 34.057.889 22 .889z"
              animatedProps={animatedProps}
              fill="#ff0000"  // Provide initial colour to avoid '-1 is not a valid color or brush' warning
              stroke="#fff"
              strokeWidth={STROKE_WIDTH}
              fillRule="evenodd"
            />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
