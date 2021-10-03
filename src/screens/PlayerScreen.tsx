import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, Dimensions, StyleSheet, View } from "react-native";
import { Layout, Text } from "@ui-kitten/components";

import MusicPicker, {
  Song,
} from "../../custom_native_modules/expo-music-picker/src/MusicPicker";
import { Audio } from "../../custom_native_modules/expo-av-jsi/src";
import Reanimated, {
  cancelAnimation,
  Extrapolate,
  interpolate,
  runOnUI,
  useSharedValue,
  withTiming,
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
import { useDevicesStore } from "../bluetooth/BluetoothManager";
import shallow from "zustand/shallow";
import { isDeviceSupported, sendCommandTo } from "../bluetooth/BluetoothDevice";
import { Switch } from "react-native-gesture-handler";

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

const calculateBins = makeOptimalQuadraticBinsForSamples(
  NUM_BINS,
  N_SAMPLES_TO_PROCESS,
  LOG_COEFF
);

export default function PlayerScreen() {
  const [result, setResult] = React.useState("None yet...");
  const [sound, setSound] = React.useState<Audio.Sound>();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // as long as the hooks are always called in the same order, it's ok
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
    console.log("Song:", song);

    if (song.canceled !== false) {
      return;
    }

    loadSound(song.uri);
    setResult(prepareSongDisplayName(song));
  };

  const updateBinHeights = (values: number[]) => {
    "worklet";
    for (let i = 0; i < NUM_BINS; i++) {
      bins[i].value = interpolate(
        values[i],
        [0, 90, 200, 900],
        [1, 60, 90, 100],
        Extrapolate.CLAMP
      );
    }
  };

  const fadeBinsDown = () => {
    "worklet";
    for (let i = 0; i < NUM_BINS; i++) {
      cancelAnimation(bins[i]);
      bins[i].value = withTiming(1, { duration: 500 });
    }
  };

  const onSampleReceived = (sample: Audio.AudioSample) => {
    // Considerations below do not respect log scale!
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
    const freqs = cfft(sample.channels[0].frames.slice(0, FFT_SIZE)).map((n) =>
      n.mag()
    );

    if (freqs.some(isNaN)) return;
    const binValues = calculateBins(freqs);

    runOnUI(updateBinHeights)(binValues);
  };

  async function loadSound(uri: string) {
    console.log("Loading Sound");
    console.log("Bin width", BIN_WIDTH);
    console.log("Display bin width", DISPLAY_BIN_WIDTH);
    console.log("Max bin freq", MAX_BIN_FREQ);

    const { sound } = await Audio.Sound.createAsync({
      uri,
    });

    setSound(sound);
  }
  const [isBtMusicEnabled, setBtMusicEnabled] = React.useState(false);
  const toggleSwitch = () =>
    setBtMusicEnabled((previousState) => !previousState);
  const [isConnected, device] = useDevicesStore(
    (state) => [state.connectedDevice != null, state.connectedDevice],
    shallow
  );

  const updateBtLedRgb = async () => {
    if (isBtMusicEnabled && isConnected && (await isDeviceSupported(device))) {
      const r = bins[0].value * 2.5;
      const g = bins[5].value * 2.5;
      const b = bins[9].value * 2.5;
      const str = `RGB ${Math.trunc(r)} ${Math.trunc(g)} ${Math.trunc(b)}`;
      await sendCommandTo(device, str);
    }
  };
  React.useEffect(() => {
    // Update RGB LED every 100ms - probably can go down to 50ms, but 10 Hz is good enough
    // BT module communicates at baud 9600 bps, average command is 17 characters long (RGB xxx yyy zzz\r\n)
    // so in theory single transmission takes < 20ms
    const intervalId = setInterval(() => updateBtLedRgb(), 100);

    return () => clearInterval(intervalId);
  }, [isConnected, isBtMusicEnabled]);

  async function startPlaying() {
    console.log("Playing Sound");
    sound.onAudioSampleReceived = onSampleReceived;
    await sound.playAsync();
  }

  async function stopPlaying() {
    await sound?.pauseAsync();

    // even after awaiting pauseAsync(), the sample callback
    // is still called a few times, which broke the "fade down" animation
    // - so it is removed here to prevent this.
    sound.onAudioSampleReceived = undefined;
    console.log("Paused");

    runOnUI(fadeBinsDown)();
  }

  const [dim, onLayout] = useMeasure();

  return (
    <Layout style={styles.container} level="2">
      <Text>Result: {result}</Text>
      <Button onPress={openPicker} title="Open picker" />
      <Button title="Play Sound" onPress={startPlaying} />
      <Button title="Pause" onPress={stopPlaying} />
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        <Switch
          trackColor={{ false: "#767577", true: "#71baee" }}
          thumbColor={isBtMusicEnabled ? "#ff7700" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isBtMusicEnabled}
        />
        <Text style={{ marginLeft: 10 }}>Animate RGB according to music</Text>
      </View>
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
