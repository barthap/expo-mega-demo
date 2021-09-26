# Expo Mega Demo

Experimenting with new awesome React Native + Expo features.

**Work in progress**. More info soon.

## Known issues

- `expo-dev-client` config plugin is not yet working with SDK 43.
  - It hangs the CLI for Android at the `dangerousMod -> Main Activity`
  - It messes up the `AppDelegate.m`. Workign version can be found in `./patches/AppDelegate.m` - need to be copied manually.
- Frequency bin labels are wrong 🤷. I am too lazy to think about how to calculate and it.
- Modifying the `sound.onAudioSampleReceived` callback (and sometimes the Reanimated 2 stuff too) requires at least picking the song again to reload properly, sometimes whole app restart is needed.
- Does not work on emulator.
- Not yet works for Android
  - No JSI-related `expo-av` changes applied.
  - The MusicPicker module isn't written on that platform (there's copy-pasted `expo-haptics` code ¯\_(ツ)\_/¯)
