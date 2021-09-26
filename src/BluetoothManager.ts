import { BleManager, Device } from "react-native-ble-plx";
import create from "zustand";
import { produce } from "immer";

export const BluetoothManager = new BleManager();

type State = {
  devices: Record<string, Device>;
  isScanning: boolean;
  connectedDevice: Device | null;
};
export const useDevicesStore = create<State>((set, get) => ({
  devices: {},
  connectedDevice: null,
  isScanning: false,
}));

useDevicesStore.update = function (updater: (state: State) => void) {
  useDevicesStore.setState(produce(useDevicesStore.getState(), updater));
};

export function doDeviceScan() {
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

export function stopScanning() {
  console.log("Stopped scanning");
  useDevicesStore.update((state) => {
    state.isScanning = false;
  });
  BluetoothManager.stopDeviceScan();
}

export async function connect(deviceToConnect: Device) {
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

export function disconnect() {
  const dev = useDevicesStore.getState().connectedDevice;
  if (!dev) return;

  BluetoothManager.cancelDeviceConnection(dev.id);
  useDevicesStore.update((state) => {
    state.connectedDevice = null;
  });
  console.log("Disconnected");
}
