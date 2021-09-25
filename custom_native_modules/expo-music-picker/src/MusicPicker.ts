import { UnavailabilityError } from "expo-modules-core";

import ExpoMusicPicker from "./ExpoMusicPicker";

type MusicPickerType = {
  openPicker(options: any): Promise<any>;
  sayHello(): Promise<string>;
};

const MusicPicker: MusicPickerType = {
  async openPicker(options: any = {}): Promise<any> {
    if (!ExpoMusicPicker.openPicker) {
      throw new UnavailabilityError("expo-music-picker", "openPicker");
    }

    return await ExpoMusicPicker.openPicker(options);
  },

  async sayHello(): Promise<string> {
    if (!ExpoMusicPicker.sayHello) {
      throw new UnavailabilityError("expo-music-picker", "sayHello");
    }

    return await ExpoMusicPicker.sayHello();
  },
};

export default MusicPicker as MusicPickerType;
