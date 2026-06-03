import { Tabs } from 'expo-router';
import { StyleSheet, Text, type ColorValue } from 'react-native';
import { ExpenseSheetProvider, useExpenseSheet } from '../../src/context/ExpenseSheetContext';

function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={[styles.tabIcon, { color }]}>{icon}</Text>;
}

function TabsNavigator() {
  const { sheetOpen } = useExpenseSheet();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: '#F8FAFC' },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
          display: sheetOpen ? 'none' : 'flex',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses/index"
        options={{
          title: 'Expenses',
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <ExpenseSheetProvider>
      <TabsNavigator />
    </ExpenseSheetProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 20 },
});
