import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Layout, Text } from "@ui-kitten/components";
import Reanimated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AXIS_LABELS_HEIGHT = 20;

interface Props {
  /**
   * Bin height values, range [1, 100]
   */
  bins: SharedValue<number>[];
  /**
   * For bin labels - low and high frequency
   * Middle will be calculated automatically (log10 middle)
   */
  frequencyRange: [low: number, high: number];
  /**
   * Height for bins container / max bin height.
   */
  height: number;
}

interface SpectrumBinProps {
  binValue: SharedValue<number>,
  binWidth: number;
  maxHeight: number,
}
function SpectrumBin(props: SpectrumBinProps) {
  const { binValue, binWidth, maxHeight} = props;
  const animatedStyle = useAnimatedStyle(() => {
    const value = interpolate(
      binValue.value,
      [1, 100],
      [1, maxHeight],
      Extrapolation.CLAMP,
    );
    return {
      height: withSpring(value, {
        mass: 1,
        damping: 500,
        stiffness: 800,
      }),
    };
  });
  return (
    <Reanimated.View
      style={[styles.bin, animatedStyle, { width: binWidth }]}
    />
  );
}

export default function AudioSpectrum(props: Props) {
  const { bins, frequencyRange } = props;

  const height = props.height - AXIS_LABELS_HEIGHT;
  const binWidth = React.useMemo(
    // Although caching is not recommended, we don't support
    // landscape mode, so this stays constant
    () => Dimensions.get("window").width / bins.length,
    [bins.length]
  );

  const [lowFreq, highFreq] = frequencyRange;
  const midFreq = React.useMemo(
    () => Math.pow(10, Math.log10(lowFreq * highFreq) / 2),
    [lowFreq, highFreq],
  );

  const binElements = React.useMemo(() => [...new Array(bins.length).keys()].map((key, idx) => (
    <SpectrumBin
      key={key}
      binValue={bins[idx]}
      binWidth={binWidth}
      maxHeight={height}
    />
    // we don't have to memoize bins, they're SharedValues and
    // their references don't change (as long as created with useSharedValue())
  )), [bins.length, binWidth, height]);

  return (
    <>
      <Layout level="1" style={[styles.binContainer, { height }]}>
        <Reanimated.View style={{ width: 0, height }} />
        {binElements}
      </Layout>
      <Layout level="3" style={styles.xAxisLabels}>
        <Text>{formatHertzString(lowFreq, { digits: 0 })} Hz</Text>
        <Text>{formatHertzString(midFreq, { digits: 0 })} Hz</Text>
        <Text>{formatHertzString(highFreq / 1000, { digits: 1 })} kHz</Text>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  binContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "stretch",
  },
  bin: {
    backgroundColor: "#ff9900",
    alignSelf: "flex-end",
    borderColor: "#ff7700",
    borderRightWidth: 1,
    borderLeftWidth: 1,
  },
  xAxisLabels: {
    height: AXIS_LABELS_HEIGHT,
    width: Dimensions.get("window").width,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

// `toLocaleString()` does not work in Hermes (https://github.com/facebook/react-native/issues/31152)
// doing it manually
const formatHertzString = (
  frequency: number,
  { digits }: { digits: number },
) => {
  const freqStr = frequency.toString();

  const dotIndex = freqStr.indexOf(".");
  if (dotIndex < 0) return freqStr;

  const offset = digits + Number(!!digits);
  return freqStr.substring(0, dotIndex + offset);
};
