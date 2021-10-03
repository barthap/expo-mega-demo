import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BluetoothManager,
  connect,
  disconnect,
  doDeviceScan,
  stopScanning,
  useDevicesStore,
} from "../bluetooth/BluetoothManager";
import { DeviceList } from "../components/DeviceList";
import { Layout, Text, Button, Card } from "@ui-kitten/components";
import { isDeviceSupported } from "../bluetooth/BluetoothDevice";

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

  const [isSupported, setSupported] = React.useState(false);
  React.useEffect(() => {
    isDeviceSupported(store.connectedDevice).then(setSupported);
  }, [store.connectedDevice]);

  return (
    <Layout style={styles.container} level="2">
      <DeviceList
        devices={Object.values(store.devices)}
        isScanning={store.isScanning}
        onScanRefresh={doDeviceScan}
        onConnectClick={(id) => connect(store.devices[id])}
        connectedDeviceId={store.connectedDevice?.id ?? null}
      />

      <Card style={styles.card} header={CardHeader} footer={CardFooter}>
        <Text
          status={
            store.connectedDevice
              ? isSupported
                ? "success"
                : "warning"
              : "info"
          }
        >
          {store.connectedDevice
            ? `This device is ${isSupported ? "" : "NOT "}supported by this app`
            : "Connect to see more info"}
        </Text>
      </Card>
    </Layout>
  );
}

const CardHeader = (props) => {
  const dev = useDevicesStore((state) => state.connectedDevice);
  return (
    <View {...props}>
      <Text category="h6">{dev?.name || "Not connected"}</Text>
      <Text category="s1">{dev?.id}</Text>
    </View>
  );
};

const CardFooter = (props) => {
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
