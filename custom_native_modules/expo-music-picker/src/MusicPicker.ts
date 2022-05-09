import { UnavailabilityError } from "expo-modules-core";

import ExpoMusicPicker from "./ExpoMusicPicker";

export interface Song {
  uri: string;
  title: string;
  artist: string | null;
  displayName: string;
}

interface PickerResultBase {
  canceled: boolean;
}

interface PickerResultCanceled extends PickerResultBase {
  canceled: true;
}

interface PickerResultSuccess extends PickerResultBase, Song {
  canceled: false;
}

type PickerResult = PickerResultSuccess | PickerResultCanceled;

const MusicPicker = {
  async openPicker(options: any = {}): Promise<PickerResult> {
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

export default MusicPicker;
