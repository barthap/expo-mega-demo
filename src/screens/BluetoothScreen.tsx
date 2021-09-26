import React from "react";
import { View } from "react-native";
import { BluetoothManager } from "../BluetoothManager";
import { Device } from "react-native-ble-plx";
import create from "zustand";
import { produce } from "immer";
import { DeviceList } from "../components/DeviceList";
import { Layout, Text } from "@ui-kitten/components";

type State = { devices: Record<string, Device>; isScanning: boolean };
const useDevicesStore = create<State>((set, get) => ({
  devices: {},
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
    // devices[device.id] = device;
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

  const deviceInfos = useDevicesStore((state) => state);

  return (
    <Layout style={{ flex: 1 }}>
      <DeviceList
        devices={Object.values(deviceInfos.devices)}
        isScanning={deviceInfos.isScanning}
        onScanRefresh={doDeviceScan}
      />
    </Layout>
  );
}
