import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import MusicPicker from "./custom_native_modules/expo-music-picker/src/MusicPicker";
import { Audio } from "./custom_native_modules/expo-av/src";
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { cfft } from "./fft";

export default function App() {
  const [result, setResult] = React.useState("loading...");
  const [sound, setSound] = React.useState<Audio.Sound>();
  const [uri, setUri] = React.useState("");

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const bins = [...new Array(8)].map(() => useSharedValue(1));

  React.useEffect(() => {
    //MusicPicker.sayHello().then(setResult);

    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const onClick = async () => {
    const song = await MusicPicker.openPicker({});
    console.log(song);
    setUri(song.uri);
    setResult(JSON.stringify(song, null, 2));
  };

  async function playSound() {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({
      uri,
    });
    sound.onAudioSampleReceived = (sample) => {
      const freqs = cfft(sample.channels[0].frames.slice(0, 2048)).map((n) =>
        n.mag()
      );

      for (let i = 0; i < 8; i++) {
        let inRange = [0, 4];
        if (i === 0) inRange = [0, 25];

        const fbin =
          freqs.slice(i * 64, (i + 1) * 64).reduce((a, b) => a + b, 0) / 64;
        bins[i].value = interpolate(fbin, inRange, [1, 300], Extrapolate.CLAMP);
      }
    };

    setSound(sound);

    console.log("Playing Sound");
    await sound.playAsync();
  }

  async function stopPlaying() {
    sound?.pauseAsync();
  }

  const animatedStyles: any[] = new Array(8);

  for (let i = 0; i < 8; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    animatedStyles[i] = useAnimatedStyle(
      () => ({
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
    <View style={styles.container}>
      <Text>Result: {result}</Text>
      <Button onPress={onClick} title="Open picker" />
      <Button title="Play Sound" onPress={playSound} />
      <Button title="Pause" onPress={stopPlaying} />
      <StatusBar style="auto" />
      <View style={styles.binContainer}>
        <Reanimated.View style={{ width: 0, height: 300 }} />
        {animatedStyles.map((style, idx) => (
          <Reanimated.View key={idx} style={[styles.bin, style]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
