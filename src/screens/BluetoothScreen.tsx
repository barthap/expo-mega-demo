import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BluetoothManager,
  connect,
  disconnect,
  doDeviceScan,
  stopScanning,
  useDevicesStore,
} from "../BluetoothManager";
import { DeviceList } from "../components/DeviceList";
import { Layout, Text, Button, Card } from "@ui-kitten/components";

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
