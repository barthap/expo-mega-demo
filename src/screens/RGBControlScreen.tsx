import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Layout, Text, Button, Input } from "@ui-kitten/components";
import shallow from "zustand/shallow";
import { useDevicesStore } from "../BluetoothManager";
import { Buffer } from "buffer";

export default function RGBControlScreen() {
  const [isConnected, device] = useDevicesStore(
    (state) => [state.connectedDevice != null, state.connectedDevice],
    shallow
  );

  const [command, setCommand] = React.useState("");

  const sendCommand = async () => {
    // SERVICE id 0xFFE0
    // CHARACTERISTIC ID 0xFFE1
    const services = await device?.services();
    console.log(services.map(({ id, uuid }) => ({ id, uuid })));
    const serialService = services.find((it) => it.uuid.startsWith("0000ffe0"));
    const characteristics = await serialService.characteristics();
    console.log(characteristics.map(({ id, uuid }) => ({ id, uuid })));
    const serialCharacteristic = characteristics.find((it) =>
      it.uuid.startsWith("0000ffe1")
    );
    serialCharacteristic.writeWithoutResponse(
      Buffer.from(`${command}\r\n`).toString("base64")
    );

    setCommand("");
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Layout style={styles.container} level="2">
        {isConnected ? (
          <Text status="success" category="s2">
            Connected to {device.name ?? "[no name]"}
          </Text>
        ) : (
          <Text status="danger" category="s2">
            Connect to a Bluetooth device first!
          </Text>
        )}
        <Text>Hello</Text>

        <Layout level="3" style={styles.formGroup}>
          <Input
            style={styles.input}
            placeholder="Enter command here"
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={sendCommand}
          />
          <Button size="small" style={{ margin: 3 }} onPress={sendCommand}>
            Send
          </Button>
        </Layout>
      </Layout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "column",
  },
  formGroup: {
    flexDirection: "row",
  },
  input: {
    flex: 1,
    margin: 2,
  },
});
