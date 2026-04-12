import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc',
          borderTopColor: colorScheme === 'dark' ? '#1e293b' : '#e2e8f0',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc',
        },
        headerTintColor: palette.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="warehouses"
        options={{
          title: 'Kho',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="store" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="swap-horiz" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
