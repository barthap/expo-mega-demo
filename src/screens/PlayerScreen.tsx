import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, View } from "react-native";
import { ApplicationProvider, Layout, Text } from "@ui-kitten/components";

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
  exponentBinsForSamples,
  getBinWidth,
  ithBinToFreq,
  makeOptimalQuadraticBinsForSamples,
  normalizeUsingSum,
  quadraticBinsForSamplesOptimal,
} from "../math/convolution";

function prepareSongDisplayName({ artist, title }: Song) {
  return artist ? `${artist} - ${title}` : title;
}

const FFT_SIZE = 2048;
const SAMPLING_RATE = 44100;
const N_SAMPLES_TO_PROCESS = 256;

let capturedSamples = new Array(2048);
let capturedFftMag = new Array(2048);

export default function PlayerScreen() {
  const [result, setResult] = React.useState("None yet...");
  const [sound, setSound] = React.useState<Audio.Sound>();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const bins = [...new Array(8)].map(() => useSharedValue(1));

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
    const BIN_WIDTH = getBinWidth(SAMPLING_RATE, FFT_SIZE);
    console.log("Loading Sound");
    console.log("Bin width", BIN_WIDTH);
    console.log(
      "Display bin width",
      convWidthForNumBins(8, N_SAMPLES_TO_PROCESS) * BIN_WIDTH
    );
    console.log("Max bin freq", BIN_WIDTH * N_SAMPLES_TO_PROCESS);
    const { sound } = await Audio.Sound.createAsync({
      uri,
    });
    const calculateBins = makeOptimalQuadraticBinsForSamples(
      8,
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

      // sss++;
      // if (sss === 100) {
      //   capturedSamples = sample.channels[0].frames.slice(0, FFT_SIZE);
      //   capturedFftMag = freqs;
      //   console.log("captured");
      // }

      // const normalizedBins = normalizeUsingSum(
      //   exponentBinsForSamples(freqs, 8, N_SAMPLES_TO_PROCESS)
      // ).map((i) => i * 5);

      // const normalizedBins = quadraticBinsForSamplesOptimal(
      //   freqs,
      //   8,
      //   N_SAMPLES_TO_PROCESS
      // );

      const normalizedBins = calculateBins(freqs);

      // console.log(normalizedBins);

      for (let i = 0; i < 8; i++) {
        let inRange = [0, 4];
        if (i === 0) inRange = [0, 25];

        const fbin = normalizedBins[i];
        // const fbin =
        //   freqs.slice(i * 64, (i + 1) * 64).reduce((a, b) => a + b, 0) / 64;
        // bins[i].value = interpolate(fbin, inRange, [1, 300], Extrapolate.CLAMP);
        bins[i].value = interpolate(
          fbin,
          [0, 80, 130],
          [1, 150, 300],
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
      for (let i = 0; i < 8; i++) {
        bins[i].value = 1;
      }
    }, 500);
    // console.log(
    //   capturedFftMag
    //     .slice(0, 512)
    //     .map((f) => f.toString().slice(0, 8))
    //     .join(",")
    //   // capturedSamples.map((f: number) => f.toString().slice(0, 7)).join(",")
    // );
  }

  const animatedStyles: any[] = new Array(8);

  for (let i = 0; i < 8; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    animatedStyles[i] = useAnimatedStyle(
      () => ({
        // height: bins[i].value,
        height: withSpring(bins[i].value, {
          mass: 1,
          damping: 500,
          stiffness: 1000,
        }),
      }),
      [bins[i]]
    );
  }

  return (
    <Layout style={styles.container} level="2">
      <Text>Result: {result}</Text>
      <Button onPress={openPicker} title="Open picker" />
      <Button title="Play Sound" onPress={startPlaying} />
      <Button title="Pause" onPress={stopPlaying} />
      <StatusBar style="auto" />
      <View style={styles.binContainer}>
        <Reanimated.View style={{ width: 0, height: 300 }} />
        {animatedStyles.map((style, idx) => (
          <Reanimated.View key={idx} style={[styles.bin, style]} />
        ))}
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
  container2: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
  binContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    height: 300,
    backgroundColor: "#ffffff",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
  },
  bin: {
    width: 30,
    backgroundColor: "#ff9900",
    alignSelf: "flex-end",
  },
});
