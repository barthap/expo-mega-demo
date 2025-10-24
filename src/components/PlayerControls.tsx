import * as React from "react";

import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import {
  GestureResponderEvent,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  Text,
  withStyles,
  EvaProp,
} from "@ui-kitten/components";
import { AudioStatus } from "expo-audio";

interface Props {
  header?: JSX.Element;
  extraButtons?: (
    | {
        iconName: string;
        title: string;
        onPress: (event: GestureResponderEvent) => void;
        active: boolean;
        disable?: boolean;
      }
    | (() => React.ReactNode)
  )[];
  style?: StyleProp<ViewStyle>;

  // Functions
  playAsync: () => void;
  pauseAsync: () => void;
  replayAsync: () => void;
  pickSong: () => void;
  setIsMutedAsync: (isMuted: boolean) => void;
  setPositionAsync: (position: number) => Promise<any>;
  setIsLoopingAsync: (isLooping: boolean) => void;
  setVolume: (volume: number) => void;

  // Status
  playerStatus: AudioStatus;
  title: string | null;
  volume: number;

  // Error
  eva?: EvaProp;
}

function Player(props: Props) {
  const { eva } = props;
  const styles = eva.style as any;
  const tintColor = eva.theme["color-primary-default"] as string;

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [initialScrubbingMillis, setInitialScrubbingMillis] = React.useState<
    undefined | number
  >();
  
  const { loop, currentTime, isLoaded, playing, duration, mute } = props.playerStatus;
  
  const positionMillis = currentTime * 1000;
  const durationMillis = duration * 1000;

  const _play = () => props.playAsync();

  const _pause = () => props.pauseAsync();

  const _playFromPosition = (position: number) =>
    props.setPositionAsync(position / 1000.0).then(() => setIsScrubbing(false));

  const _toggleLooping = () => props.setIsLoopingAsync(!loop);

  const _seekForward = () =>
    props.setPositionAsync(currentTime + 5.0);

  const _seekBackward = () =>
    props.setPositionAsync(Math.max(0, currentTime - 5.0));

  const _renderReplayButton = () => {
    return (
      <TouchableOpacity onPress={_toggleLooping} disabled={!isLoaded}>
        <Ionicons
          name="repeat"
          size={34}
          style={[styles.icon, !loop && { color: "#C1C1C1" }]}
        />
      </TouchableOpacity>
    );
  };

  const _renderPlayPauseButton = () => {
    let onPress = _pause;
    let iconName = "pause";

    if (!playing) {
      onPress = _play;
      iconName = "play";
    }

    return (
      <TouchableOpacity onPress={onPress} disabled={!isLoaded}>
        <Ionicons
          name={iconName as "pause" | "play"}
          style={[
            styles.icon,
            styles.playPauseIcon,
            !isLoaded && styles.disabledIcon,
          ]}
        />
      </TouchableOpacity>
    );
  };

  const _renderAuxiliaryButton = ({
    disable,
    iconName,
    title,
    onPress,
    forceEnabled = false,
  }: {
    disable?: boolean;
    iconName: string;
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    forceEnabled?: boolean;
  }) => {
    const isDisabled = !isLoaded && !forceEnabled;
    if (disable) {
      return null;
    }
    return (
      <TouchableOpacity
        key={title}
        style={styles.button}
        disabled={isDisabled}
        onPress={onPress}
      >
        <Ionicons
          name={`${iconName}` as any}
          size={iconName === "refresh" ? 20 : 24}
          style={[
            styles.icon,
            styles.buttonIcon,
            isDisabled && styles.disabledIcon,
          ]}
        />
        <Text style={[styles.buttonText, isDisabled && styles.disabledIcon]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={props.style}>
      <View
        style={{ opacity: isScrubbing ? 0.8 : 1, backgroundColor: "black" }}
      >
        {props.header}
      </View>
      <View style={styles.container}>
        {_renderPlayPauseButton()}
        <Slider
          style={[styles.slider, !isLoaded && styles.disabledIcon]}
          thumbTintColor={tintColor}
          value={isScrubbing ? initialScrubbingMillis : positionMillis}
          maximumValue={durationMillis}
          disabled={!isLoaded}
          minimumTrackTintColor={tintColor}
          onSlidingComplete={_playFromPosition}
          onResponderGrant={() => {
            setIsScrubbing(true);
            setInitialScrubbingMillis(positionMillis);
          }}
        />
        <Text
          style={{ width: 100, textAlign: "right" }}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {_formatTime(currentTime)} /{" "}
          {_formatTime(duration)}
        </Text>
        {_renderReplayButton()}
      </View>

      <Text
        category="c2"
        numberOfLines={1}
        style={{ paddingHorizontal: 8 }}
        appearance={props.title ? "default" : "hint"}
      >
        {props.title || "No song selected"}
      </Text>

      <View style={styles.container}>
        <VolumeSlider
          color={tintColor}
          isMuted={mute}
          disabled={!isLoaded}
          style={{ width: undefined, flex: 1 }}
          volume={props.volume}
          onValueChanged={({ isMuted, volume }) => {
            props.setIsMutedAsync(isMuted);
            props.setVolume(volume);
          }}
        />
      </View>

      <View style={[styles.container, styles.buttonsContainer]}>
        {_renderAuxiliaryButton({
          iconName: "musical-notes-sharp",
          title: "Pick a song",
          onPress: props.pickSong,
          forceEnabled: true,
        })}
        {_renderAuxiliaryButton({
          iconName: "play-skip-back",
          title: "Replay",
          onPress: props.replayAsync,
        })}

        {_renderAuxiliaryButton({
          iconName: "play-back",
          title: "Seek Backward",
          onPress: _seekBackward,
        })}
        {_renderAuxiliaryButton({
          iconName: "play-forward",
          title: "Seek Forward",
          onPress: _seekForward,
        })}
      </View>
    </View>
  );
}

function VolumeSlider({
  volume,
  isMuted,
  disabled,
  color,
  onValueChanged,
  style,
}: {
  volume: number;
  isMuted: boolean;
  disabled?: boolean;
  color?: string;
  style?: any;
  onValueChanged: (data: { isMuted: boolean; volume: number }) => void;
}) {
  const [value, setValue] = React.useState(volume);
  const lastUserValue = React.useRef(volume);

  React.useEffect(() => {
    if (!isMuted && lastUserValue.current !== value) {
      const value = lastUserValue.current;
      setValue(value);
      onValueChanged({ isMuted, volume: value });
    }
  }, [isMuted]);

  const isMutedActive = React.useMemo(() => {
    return isMuted || value <= 0;
  }, [isMuted, value]);

  const iconName = React.useMemo(() => {
    if (isMutedActive) {
      return "volume-off";
    }
    return value > 0.5 ? "volume-high" : "volume-low";
  }, [isMutedActive, value]);

  React.useEffect(() => {
    if (value !== volume) {
      onValueChanged({ volume, isMuted });
    }
  }, [volume]);

  const height = 36;
  return (
    <View
      style={[
        { flexDirection: "row", width: 100 },
        disabled && { opacity: 0.7 },
        style,
      ]}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <TouchableOpacity
        style={{
          alignItems: "center",
          width: height,
          height,
          justifyContent: "center",
        }}
        onPress={() => {
          onValueChanged({ isMuted: !isMuted, volume });
        }}
      >
        <Ionicons
          name={`${iconName}` as "volume-high" | "volume-low" | "volume-off"}
          size={24}
          color={color}
          style={{}}
        />
      </TouchableOpacity>
      <Slider
        value={isMutedActive ? 0 : value}
        maximumValue={1}
        style={{ height, flex: 1 }}
        thumbTintColor={color}
        minimumTrackTintColor={color}
        onSlidingComplete={(value) => {
          onValueChanged({ isMuted: value <= 0, volume: value });

          if (value > 0) {
            lastUserValue.current = value;
          }
        }}
        onValueChange={(value) => {
          setValue(value);
        }}
      />
    </View>
  );
}

const _formatTime = (duration: number) => {
  const paddedSecs = _leftPad(`${Math.floor(duration % 60)}`, "0", 2);
  const paddedMins = _leftPad(`${Math.floor(duration / 60)}`, "0", 2);
  if (duration > 3600) {
    return `${Math.floor(duration / 3600)}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
};

const _leftPad = (
  s: string,
  padWith: string,
  expectedMinimumSize: number,
): string => {
  if (s.length >= expectedMinimumSize) {
    return s;
  }
  return _leftPad(`${padWith}${s}`, padWith, expectedMinimumSize);
};

const StyledComponent = withStyles(Player, (theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    padding: 8,
    color: theme["color-primary-default"],
  },
  playPauseIcon: {
    paddingTop: 11,
    fontSize: 34,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  buttonsContainer: {
    justifyContent: "space-evenly",
    alignItems: "stretch",
    minHeight: 70,
  },
  button: {
    // flex: 1,
    marginHorizontal: 5,
    paddingBottom: 6,
    borderRadius: 6,
    marginBottom: 5,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  buttonText: {
    fontSize: 12,
    color: theme["color-primary-default"],
    fontWeight: "bold",
    textAlign: "center",
    justifyContent: "center",
    flex: 1,
  },
  buttonIcon: {
    flex: 1,
    height: 36,
  },
  activeButton: {
    backgroundColor: theme["color-primary-default"],
  },
  activeButtonText: {
    color: "white",
  },
  disabledIcon: {
    color: theme["color-basic-disabled"],
  },
}));

export default StyledComponent;
