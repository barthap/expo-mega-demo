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

const updateStore = function (updater: (state: State) => void) {
  useDevicesStore.setState(produce(useDevicesStore.getState(), updater));
};

export function doDeviceScan() {
  BluetoothManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      // Handle error (scanning will be stopped automatically)
      console.error(error);
      return;
    }

    updateStore((state) => {
      state.devices[device.id] = device;
    });
    console.log("Found", device.name, device.id);
  });

  updateStore((state) => {
    state.isScanning = true;
  });

  return setTimeout(() => {
    stopScanning();
  }, 30 * 1000);
}

export function stopScanning() {
  console.log("Stopped scanning");
  updateStore((state) => {
    state.isScanning = false;
  });
  BluetoothManager.stopDeviceScan();
}

export async function connect(deviceToConnect: Device) {
  const connected = await deviceToConnect.connect();
  const device = await connected.discoverAllServicesAndCharacteristics();
  console.log("Connected to", device.name);
  updateStore((state) => {
    state.connectedDevice = device;
  });
}

export function disconnect() {
  const dev = useDevicesStore.getState().connectedDevice;
  if (!dev) return;

  BluetoothManager.cancelDeviceConnection(dev.id);
  updateStore((state) => {
    state.connectedDevice = null;
  });
  console.log("Disconnected");
}
