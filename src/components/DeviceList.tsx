import React from "react";
import { Device } from "react-native-ble-plx";
import { FlatList } from "react-native-gesture-handler";
import { ListRenderItem, Text } from "react-native";
import { StyleSheet } from "react-native";
import { Divider, List, ListItem } from "@ui-kitten/components";

interface Props {
  devices: Device[];
  onDeviceClick?: () => void;
  onScanRefresh?: () => void;
  isScanning?: boolean;
}

const RenderItem: ListRenderItem<Device> = ({ item }) => {
  return (
    <ListItem title={item.name ?? "[No name]"} description={`ID: ${item.id}`} />
  );
};

export function DeviceList(props: Props) {
  return (
    <List
      data={props.devices}
      keyExtractor={(item) => item.id}
      renderItem={RenderItem}
      ItemSeparatorComponent={Divider}
      refreshing={props.isScanning ?? false}
      onRefresh={props.onScanRefresh}
    />
  );
}
