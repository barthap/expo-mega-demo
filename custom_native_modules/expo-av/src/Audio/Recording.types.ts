// TODO: For consistency with PlaybackStatus, should we include progressUpdateIntervalMillis here as
// well?
export type RecordingStatus = {
  canRecord: boolean;
  isRecording: boolean;
  isDoneRecording: boolean;
  durationMillis: number;
  metering?: number;
  uri?: string | null;
};

export type RecordingOptions = {
  isMeteringEnabled?: boolean;
  keepAudioActiveHint?: boolean;
  android: {
    extension: string;
    outputFormat: number;
    audioEncoder: number;
    sampleRate?: number;
    numberOfChannels?: number;
    bitRate?: number;
    maxFileSize?: number;
  };
  ios: {
    extension: string;
    outputFormat?: string | number;
    audioQuality: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    bitRateStrategy?: number;
    bitDepthHint?: number;
    linearPCMBitDepth?: number;
    linearPCMIsBigEndian?: boolean;
    linearPCMIsFloat?: boolean;
  };
  web: {
    mimeType?: string;
    bitsPerSecond?: number;
  };
};
