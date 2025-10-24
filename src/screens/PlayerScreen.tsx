import React from "react";
import { StyleSheet, View } from "react-native";
import { Layout, Toggle } from "@ui-kitten/components";

// TODO: Maybe configure this with tsconfig, babel and metro.config
import * as MusicPicker from "../../custom_native_modules/expo-music-picker/src/ExpoMusicPicker";
import { useAudioPlayer, useAudioPlayerStatus, useAudioSampleListener, AudioSample, setAudioModeAsync } from "expo-audio";
import {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
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
import PlayerControls from "../components/PlayerControls";

function prepareSongDisplayName({ artist, title }: MusicPicker.MusicItem) {
  return (artist ? `${artist} - ${title}` : title) || "Untitled";
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
  LOG_COEFF,
);

type Song = {
  title: string;
  uri: string
};

export default function PlayerScreen() {
  const [song, setSong] = React.useState<Song | null>(null);

  const player = useAudioPlayer(song?.uri);
  const playerStatus = useAudioPlayerStatus(player);
  
  React.useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true
    });
  }, []);
  
  React.useEffect(() => {
    console.log('State:', playerStatus.playbackState);
    console.log('Status:', playerStatus.timeControlStatus);
  }, [playerStatus.playbackState, playerStatus.timeControlStatus]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // as long as the hooks are always called in the same order, it's ok
  const bins = [...new Array(NUM_BINS)].map(() => useSharedValue(1));

  const unloadSound = () => {
    if (song) {
      console.log("Unloading Sound");
      try {
        player.setAudioSamplingEnabled(false);
      } catch {
        console.log("WARN: Audio shared object already removed")
      }
      
      setSong(null);
      scheduleOnUI(fadeBinsDown);
    }
  };

  // Song unloading when screen is deleted
  React.useEffect(() => {
    return () => {
      unloadSound();
    };
  }, []);

  const openPicker = async () => {
    const permissions = await MusicPicker.requestPermissionsAsync();
    if (!permissions.granted) {
      console.log("No permission");
      return;
    }
    const result = await MusicPicker.openMusicLibraryAsync({
      allowMultipleSelection: false,
      includeArtworkImage: false,
    });

    if (result.cancelled !== false || result.items.length !== 1) {
      return;
    }
    const [selectedSong] = result.items;
    
    if (selectedSong.uri == song?.uri) {
      // the same song selected, do nothing
      return;
    }

    console.log("Song:", selectedSong);
    console.log("Loading Sound");
    console.log("Bin width", BIN_WIDTH);
    console.log("Display bin width", DISPLAY_BIN_WIDTH);
    console.log("Max bin freq", MAX_BIN_FREQ);
    unloadSound(); // unload previous song, if exists
    setSong({ uri: selectedSong.uri, title: prepareSongDisplayName(selectedSong) });
  };

  const updateBinHeights = (values: number[]) => {
    "worklet";
    for (let i = 0; i < NUM_BINS; i++) {
      bins[i].value = interpolate(
        values[i],
        [0, 80, 120, 200],
        [1, 60, 90, 100],
        Extrapolation.CLAMP,
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

  const onSampleReceived = (sample: AudioSample) => {
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
    const samples = sample.channels[0].frames.slice(0, FFT_SIZE);
    const freqs = cfft(samples).map((n) => n.mag());

    if (freqs.some(isNaN)) return;
    const binValues = calculateBins(freqs);
    scheduleOnUI(updateBinHeights, binValues);
  };
  useAudioSampleListener(player, onSampleReceived);

  const [isBtMusicEnabled, setBtMusicEnabled] = React.useState(false);
  const toggleSwitch = () =>
    setBtMusicEnabled((previousState) => !previousState);
  const [isConnected, device] = useDevicesStore(
    (state) => [state.connectedDevice != null, state.connectedDevice],
    shallow,
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

  // Updating LED
  React.useEffect(() => {
    // Update RGB LED every 100ms - probably can go down to 50ms, but 10 Hz is good enough
    // BT module communicates at baud 9600 bps, average command is 17 characters long (RGB xxx yyy zzz\r\n)
    // so in theory single transmission takes < 20ms
    const intervalId = setInterval(() => updateBtLedRgb(), 100);

    return () => clearInterval(intervalId);
  }, [isConnected, isBtMusicEnabled]);

  async function startPlaying() {
    console.log("Playing Sound");
    player.setAudioSamplingEnabled(true);
    player.play();
  }

  async function stopPlaying() {
    player.pause();

    // even after pausing, the sample callback might still be called a few times,
    // which breaks the "fade down" animation - so it is removed here to prevent this.
    player.setAudioSamplingEnabled(false);
    console.log("Paused");

    scheduleOnUI(fadeBinsDown);
  }

  const [dim, onLayout] = useMeasure();

  const _replayAsync = async () => { await player.seekTo(0); player.play(); }
  const _setPositionAsync = async (position: number) =>
    player.seekTo(position)
  const _setIsLoopingAsync = async (isLooping: boolean) =>
    { player.loop = isLooping; }
  const _setIsMutedAsync = async (isMuted: boolean) =>
    { player.muted = isMuted; }
  const _setVolumeAsync = async (volume: number) =>
{ player.volume = volume; }

  return (
    <Layout style={styles.container} level="2">
      <PlayerControls
        playerStatus={playerStatus}
        title={song?.title}
        volume={player.volume}
        playAsync={startPlaying}
        pauseAsync={stopPlaying}
        replayAsync={_replayAsync}
        setPositionAsync={_setPositionAsync}
        setIsLoopingAsync={_setIsLoopingAsync}
        setIsMutedAsync={_setIsMutedAsync}
        setVolume={_setVolumeAsync}
        pickSong={openPicker}
      />
      <Toggle
        checked={isBtMusicEnabled}
        onChange={toggleSwitch}
        style={{ justifyContent: "flex-start", marginLeft: 5, marginBottom: 5 }}
      >
        Animate RGB according to music
      </Toggle>
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
  },
});
