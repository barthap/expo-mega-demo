import { Device } from "react-native-ble-plx";
import { Buffer } from "buffer";

// UUIDs for HM-10 BLE module
// Module page (PL): https://botland.com.pl/moduly-bluetooth/9515-modul-bluetooth-40-ble-hm-10-at-09-mlt-bt05-33v5v-5904422313524.html
// Nice HM-10 comprehensive guide: http://www.martyncurrey.com/hm-10-bluetooth-4ble-modules/
export const BT05_SERVICE_UUID_PREFIX = "0000ffe0"; // 0000ffe0-0000-1000-8000-00805f9b34fb
export const BT05_CHARACTERISTIC_UUID_PREFIX = "0000ffe1"; // 0000ffe1-0000-1000-8000-00805f9b34fbex

/**
 * Checks if given `device` contains characteristic for serial communication
 */
export async function isDeviceSupported(device?: Device): Promise<boolean> {
  const services = await device?.services();
  const serialService = services?.find((it) =>
    it.uuid.startsWith(BT05_SERVICE_UUID_PREFIX)
  );
  const characteristics = await serialService?.characteristics();
  const serialCharacteristic = characteristics?.find((it) =>
    it.uuid.startsWith(BT05_CHARACTERISTIC_UUID_PREFIX)
  );
  return serialCharacteristic != null;
}

export async function sendCommandTo(device: Device, command: string) {
  await device.writeCharacteristicWithoutResponseForService(
    BT05_SERVICE_UUID_PREFIX,
    BT05_CHARACTERISTIC_UUID_PREFIX,
    Buffer.from(`${command}\r\n`).toString("base64")
  );
}
