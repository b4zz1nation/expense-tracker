import { Link, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, type ColorValue } from 'react-native';

function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={[styles.tabIcon, { color }]}>{icon}</Text>;
}

function AddButton() {
  return (
    <Link href="/expenses/new" asChild>
      <Pressable accessibilityRole="button" accessibilityLabel="Add expense" style={styles.headerAction}>
        <Text style={styles.headerActionText}>＋ Add</Text>
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
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
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerRight: AddButton,
        }}
      />
      <Tabs.Screen
        name="expenses/index"
        options={{
          title: 'Expenses',
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} />,
          headerRight: AddButton,
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

const styles = StyleSheet.create({
  tabIcon: { fontSize: 20 },
  headerAction: { paddingHorizontal: 16, paddingVertical: 8 },
  headerActionText: { color: '#2563EB', fontWeight: '800', fontSize: 15 },
});
