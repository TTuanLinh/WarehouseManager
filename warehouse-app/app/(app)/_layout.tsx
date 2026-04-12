import { Stack } from 'expo-router';

export default function AppGroupLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Cài đặt', headerShown: true }} />
      <Stack.Screen name="warehouses/[id]" options={{ title: 'Chi tiết kho', headerShown: true }} />
    </Stack>
  );
}
