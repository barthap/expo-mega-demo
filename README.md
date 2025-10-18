# Expo Mega Demo

> _A demo app created in times of Expo SDK 42-45, when features shown here were new/experimental. Recently it was updated to **Expo SDK 54**, and they're mature and stable now. See [commit](https://github.com/barthap/expo-mega-demo/commit/3acc9bd5e942bcf7f955f96b3d9007a5e5a2979e) for details._

Experimenting with new awesome React Native + Expo features.

**Work in progress**. More info soon.

A preview video (**click the image**):
[![Watch the video](https://user-images.githubusercontent.com/278340/135893709-e7549883-8d16-4446-8f1d-ef0e4bae024c.jpg)](https://youtu.be/GIyyjOoqZ5Y)

### Core features

> **⚠️ Caution!** Some features used in this demo are in early, experimental stage and they're not ready for production. Use at your own risk.

- Runs on **Expo SDK 54**, takes advantage of the [Expo Modules architecture](https://docs.expo.dev/modules/overview/).
- Uses [Expo Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/) - a _prebuilding_ is used to generate native directories. All native changes (even these unusual) and patches are covered with config plugins.
- Uses [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/), react-navigation, ui-kitten
- Bluetooth communication using [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) with Expo config plugin.
- Color picker using Expo GL, made from [this tutorial from William Candillon](https://www.youtube.com/watch?v=bAZhVl9YvB4), but rewritten to [Reanimated v4](https://github.com/software-mansion/react-native-reanimated)
- Music Picker is an expo-module written using [Swift/Kotlin Expo Modules API](https://blog.expo.dev/a-peek-into-the-upcoming-sweet-expo-module-api-6de6b9aca492).
  > 🎉 It is now available as a separate library: [expo-music-picker](https://github.com/barthap/expo-music-picker)!
- JSI real-time Audio streaming, _inspired by [this PR](https://github.com/expo/expo/pull/13516), thank you Marc!_

  Now it is included in upstream `expo-av@11.2.3` (Expo SDK 45) so a custom native module is no longer needed!

- Player controls stolen from NCL (internal Expo rn-tester equivalent).
- FFT is calculated in the JS thread. The spectrum bin heights are written to `SharedValue`s and animated with Reanimated 4.
  > There is plan to use [react-native-multithreading](https://github.com/mrousavy/react-native-multithreading) and calculate it in a separate thread. But even without that, the JS keeps around 57-59 fps.
- Hardware: Arduino Uno and the HM-10 BLE 4.0 module. Read more in the [Hardware README](./hardware/README.md).

## How to run

First time:

1. Make sure you have Expo and all the stuff installed and configured (including Xcode)
1. Clone the repo and update submodules: `git submodule update`.
1. `yarn install`
1. `yarn prebuild`
1. `yarn run:ios`

Just to start the bundler (without rebuilding client): run `yarn start`.

## Known issues

Most of them are caused by limited time of mine, and also by some libraries, which depend on Expo, but have not yet been updated to support latest Expo features.

- Frequency bin labels are wrong 🤷. Eventually I needed to display them in log scale and I am too lazy to think about how to recalculate everything properly.
- Modifying the `sound.setOnAudioSampleReceived` callback and the Reanimated stuff requires at least picking the song again to reload properly, sometimes whole app restart is needed.
- May not work on iOS emulator. _The JSI Audio should work, but as far as I remember, the music picker does not open. And, of course, Bluetooth cannot work on simulator._
- ~~Not yet works for Android~~ There's basic experimental Android support, but with issues:
  - GL View sometimes crashes
  - JSI Audio might crash after a few seconds
  - ...
- Some mentioned in [this commit](https://github.com/barthap/expo-mega-demo/commit/3acc9bd5e942bcf7f955f96b3d9007a5e5a2979e). By the way, Expo upgrading might have fixed some of the above issues, but I haven't checked it yet.

### Applied patches

See the the `plugins` section of [`app.json`](./app.json) to see how the patches are applied:
xw

- `expo-cli` built-in plugins sets the `Push Notifications` capability even when `expo-notifications` are not installed and I see no way to disable it. Another plugin was written to delete that entitlement.
- MusicPicker module: iOS requires another `Info.plist` value about `Media Library usage permission` - a config plugin takes care of that

## No-longer-needed patches and workarounds 🎉

I started this project when Expo SDK 42 came out. So much changed since then and with each release less and less patches and workarounds were needed:

- Linking custom native modules:

  - ~~The [`custom_native_modules`](./custom_native_modules) directory needs to be added to autolinking paths in `Podfile`. A config plugin takes care of that.~~
    > It appears that it can be configured in `package.json` as `expo.autolinking.searchPaths`. It's not needed anyway, look at the next point:
  - ~~new `expo-modules-autolinking` requires modules to be specified in `package.json` dependencies. I don't want to copy my custom native modules to `node_modules` they are deleted after being copied there by yarn.~~
  - ~~Patched `expo-modules-autolinking@0.5.1` to apply changes from [this PR](https://github.com/expo/expo/pull/15415) until it's published. Now custom native modules dir can be specified in `package.json`.~~ Finally, this PR is published in upstream `expo-modules-autolinking`.

- ~~Replaced `expo-av` with my custom `expo-av-jsi` native module to support JSI Audio~~

  > ~~The JSI Audio streaming is now included in upstream `expo-av@10.2.0` but yet for iOS only. It'a super-secret hidden feature of SDK 44.~~

  In SDK 45 both platforms are now supported by Expo AV. 🎉

- ~~patch-package for `expo-gl` and related libraries - needed, because of migration from `@unimodules/core` to `expo-modules-core`~~
- ~~by default, expo modules are built with `xcframework` if available, but that does not work for patched `expo-gl`, so its `xcframework` is deleted force build from source.~~
- ~~`expo-gl` installs wrong `expo-modules-core` dependency in its own `node_modules` - it is deleted, the global `node_modules` one is correct.~~
- ~~The `AppDelegate.m` is being broken by `expo-dev-client` config plugin, wrote another config plugin to copy the patched file.~~
- ~~patch-package for `react-native-ble-plx` and [Podfile config plugin](./patches/fix-bluetooth.plugin.js), because of [this issue](https://github.com/dotintent/react-native-ble-plx/issues/899).~~
- There was a `postinstall.js` script to perform some of the patches above (like file copy/delete). Fortunately it is no longer needed. Yay! 🎉

- ~~patch-package for `webgltexture-loader-expo@1.0.0`, a dependency of `gl-react-expo` - it has not yet been updated to use `expo-modules-core` in favor of `@unimodules/core`.~~
  Upstream version 1.2.0 has it patched 🎉
