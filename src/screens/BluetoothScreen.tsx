import React from "react";
import { StyleSheet, View } from "react-native";
import { BluetoothManager } from "../BluetoothManager";
import { Device } from "react-native-ble-plx";
import create from "zustand";
import { produce } from "immer";
import { DeviceList } from "../components/DeviceList";
import { Layout, Text, Button, Card } from "@ui-kitten/components";

type State = {
  devices: Record<string, Device>;
  isScanning: boolean;
  connectedDevice: Device | null;
};
const useDevicesStore = create<State>((set, get) => ({
  devices: {},
  connectedDevice: null,
  isScanning: false,
}));

useDevicesStore.update = function (updater: (state: State) => void) {
  useDevicesStore.setState(produce(useDevicesStore.getState(), updater));
};

function doDeviceScan() {
  BluetoothManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      // Handle error (scanning will be stopped automatically)
      console.error(error);
      return;
    }

    useDevicesStore.update((state) => {
      state.devices[device.id] = device;
    });
    console.log("Found", device.name, device.id);
  });

  useDevicesStore.update((state) => {
    state.isScanning = true;
  });

  return setTimeout(() => {
    stopScanning();
  }, 30 * 1000);
}

function stopScanning() {
  console.log("Stopped scanning");
  useDevicesStore.update((state) => {
    state.isScanning = false;
  });
  BluetoothManager.stopDeviceScan();
}

async function connect(deviceToConnect: Device) {
  const connected = await deviceToConnect.connect();
  const device = await connected.discoverAllServicesAndCharacteristics();
  console.log("Connected to", device.name);
  console.log(
    "  Services:",
    (await device.services()).map((s) => s.id)
  );
  useDevicesStore.update((state) => {
    state.connectedDevice = device;
  });
}

function disconnect() {
  const dev = useDevicesStore.getState().connectedDevice;
  if (!dev) return;

  BluetoothManager.cancelDeviceConnection(dev.id);
  useDevicesStore.update((state) => {
    state.connectedDevice = null;
  });
  console.log("Disconnected");
}

export default function BluetoothScreen() {
  React.useEffect(() => {
    BluetoothManager.onStateChange((state) => {
      console.log("Outer state", state);
      const subscription = BluetoothManager.onStateChange((state) => {
        console.log("Inner state", state);
        if (state === "PoweredOn") {
          console.log("BT Power ON");
          doDeviceScan();
          subscription.remove();
        }
      }, true);
      return () => subscription.remove();
    });
  }, [BluetoothManager]);

  React.useEffect(() => {
    BluetoothManager.state().then((state) => {
      if (state === "PoweredOn") {
        doDeviceScan();
      }
    });

    return stopScanning;
  }, []);

  const store = useDevicesStore((state) => state);

  return (
    <Layout style={styles.container} level="2">
      <DeviceList
        devices={Object.values(store.devices)}
        isScanning={store.isScanning}
        onScanRefresh={doDeviceScan}
        onConnectClick={(id) => connect(store.devices[id])}
        connectedDeviceId={store.connectedDevice?.id ?? null}
      />

      <Card style={styles.card} header={Header} footer={Footer}>
        <Text>
          {JSON.stringify(store.connectedDevice?.manufacturerData, null, 2)}
        </Text>
      </Card>
    </Layout>
  );
}

const Header = (props) => {
  const dev = useDevicesStore((state) => state.connectedDevice);
  return (
    <View {...props}>
      <Text category="h6">{dev?.name || "Not connected"}</Text>
      <Text category="s1">{dev?.id}</Text>
    </View>
  );
};

const Footer = (props) => {
  const dev = useDevicesStore((state) => state.connectedDevice);
  return (
    <View {...props} style={[props.style, styles.footerContainer]}>
      <Button
        style={styles.footerControl}
        size="small"
        disabled={dev == null}
        onPress={disconnect}
      >
        DISCONNECT
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  card: {
    // flex: 1,
    margin: 5,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  footerControl: {
    marginHorizontal: 2,
  },
});
