import React from "react";
import { Device } from "react-native-ble-plx";
import { FlatList } from "react-native-gesture-handler";
import { ListRenderItem, Text } from "react-native";
import { StyleSheet } from "react-native";
import { Divider, List, ListItem, Button } from "@ui-kitten/components";

interface Props {
  devices: Device[];
  connectedDeviceId?: string | null;
  onConnectClick?: (deviceId: string) => void;
  onScanRefresh?: () => void;
  isScanning?: boolean;
}

export function DeviceList(props: Props) {
  const renderItemAccessory = (id) => () =>
    (
      <Button size="tiny" onPress={() => props.onConnectClick?.(id)}>
        Connect
      </Button>
    );

  const renderItem: ListRenderItem<Device> = ({ item }) => (
    <ListItem
      title={item.name ?? "[No name]"}
      description={`ID: ${item.id}`}
      accessoryRight={
        props.connectedDeviceId !== item.id && renderItemAccessory(item.id)
      }
    />
  );

  return (
    <List
      data={props.devices}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ItemSeparatorComponent={Divider}
      refreshing={props.isScanning ?? false}
      onRefresh={props.onScanRefresh}
    />
  );
}
