import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, Dimensions, StyleSheet, View } from "react-native";
import { Layout, Text } from "@ui-kitten/components";

import MusicPicker, {
  Song,
} from "../../custom_native_modules/expo-music-picker/src/MusicPicker";
import { Audio } from "../../custom_native_modules/expo-av-jsi/src";
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { cfft } from "../math/fft";
import {
  convWidthForNumBins,
  getBinWidth,
  ithBinToFreq,
  makeOptimalQuadraticBinsForSamples,
} from "../math/convolution";
import { makeInvLogFn } from "../math/invLog";
import AudioSpectrum from "../components/AudioSpectrum";
import { useMeasure } from "../components/picker/useMeasure";

function prepareSongDisplayName({ artist, title }: Song) {
  return artist ? `${artist} - ${title}` : title;
}

const FFT_SIZE = 2048;
const SAMPLING_RATE = 44100;
const N_SAMPLES_TO_PROCESS = 256;
const NUM_BINS = 10;
const LOG_COEFF = 20;
const BIN_WIDTH = getBinWidth(SAMPLING_RATE, FFT_SIZE);

// I realized that it will no longer work for log scale
const DISPLAY_BIN_WIDTH =
  convWidthForNumBins(NUM_BINS, N_SAMPLES_TO_PROCESS) * BIN_WIDTH;
const invLog = makeInvLogFn(LOG_COEFF, N_SAMPLES_TO_PROCESS);
const FIRST_BIN_FREQ = ithBinToFreq(BIN_WIDTH)(invLog(20));
const MAX_BIN_FREQ = BIN_WIDTH * N_SAMPLES_TO_PROCESS;

export default function PlayerScreen() {
  const [result, setResult] = React.useState("None yet...");
  const [sound, setSound] = React.useState<Audio.Sound>();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const bins = [...new Array(NUM_BINS)].map(() => useSharedValue(1));

  React.useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const openPicker = async () => {
    const song = await MusicPicker.openPicker({});
    console.log(song);

    if (song.canceled != false) {
      return;
    }

    loadSound(song.uri);
    setResult(prepareSongDisplayName(song));
  };

  async function loadSound(uri: string) {
    console.log("Loading Sound");
    console.log("Bin width", BIN_WIDTH);
    console.log("Display bin width", DISPLAY_BIN_WIDTH);
    console.log("Max bin freq", MAX_BIN_FREQ);

    const { sound } = await Audio.Sound.createAsync({
      uri,
    });
    const calculateBins = makeOptimalQuadraticBinsForSamples(
      NUM_BINS,
      N_SAMPLES_TO_PROCESS
    );
    sound.onAudioSampleReceived = (sample) => {
      // sample rate = 44.1 kHz
      // picking 2048 samples -> 1024 usable bins
      // FFT bandwidth = sample_rate / 2 = 22.05 kHz
      // Bin width = bandwidth / 1024 bins = ~21 Hz - and that is our resolution
      // ----
      // we divide it into 8 bins (bandwidth / (1024/8) --> 21 Hz * 8 = 168 Hz Bin width)
      // mih freq = 168/2 = 84Hz
      // ---
      // but let's take 512 of these bins (bandwidth = 11 kHz)
      // then single original bin width = 21Hz (still)
      // we just ignore the higher part
      const freqs = cfft(sample.channels[0].frames.slice(0, FFT_SIZE)).map(
        (n) => n.mag()
      );

      if (freqs.some(isNaN)) return;
      const binValues = calculateBins(freqs);

      for (let i = 0; i < NUM_BINS; i++) {
        let inRange = [0, 4];
        if (i === 0) inRange = [0, 25];

        // this cannot be put directly iside interpolate()
        // we must extract outside
        const fbin = binValues[i];
        bins[i].value = interpolate(
          fbin,
          [0, 90, 200],
          [1, 60, 100],
          Extrapolate.CLAMP
        );
      }
    };

    setSound(sound);
  }

  async function startPlaying() {
    console.log("Playing Sound");
    await sound.playAsync();
  }

  async function stopPlaying() {
    await sound?.pauseAsync();

    setTimeout(() => {
      for (let i = 0; i < NUM_BINS; i++) {
        bins[i].value = 1;
      }
    }, 500);
  }

  const [dim, onLayout] = useMeasure();

  return (
    <Layout style={styles.container} level="2">
      <Text>Result: {result}</Text>
      <Button onPress={openPicker} title="Open picker" />
      <Button title="Play Sound" onPress={startPlaying} />
      <Button title="Pause" onPress={stopPlaying} />
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <AudioSpectrum
          height={dim.height}
          bins={bins}
          frequencyRange={[FIRST_BIN_FREQ, MAX_BIN_FREQ]}
        />
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
