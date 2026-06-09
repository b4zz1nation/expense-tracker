import { Tabs } from 'expo-router';
import { Home, ReceiptText, Settings, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderAvatar, HeaderBell, HeaderBrand } from '../../src/components/AppHeader';
import { ExpenseSheetProvider, useExpenseSheet } from '../../src/context/ExpenseSheetContext';
import { useAppTheme } from '../../src/theme/ThemeContext';

function TabIcon({ Icon, color }: { Icon: LucideIcon; color: ColorValue }) {
  return <Icon color={color as string} size={22} strokeWidth={2.25} />;
}

function TabsNavigator() {
  const { sheetOpen } = useExpenseSheet();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const tabBarLift = Math.max(insets.bottom, theme.isCompact ? 14 : 18);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitle: () => <HeaderBrand />,
        headerTitleAlign: 'center',
        headerLeft: () => <HeaderAvatar />,
        headerRight: () => <HeaderBell />,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          height: (theme.isCompact ? 64 : 70) + tabBarLift,
          paddingTop: theme.isCompact ? 6 : 8,
          paddingBottom: tabBarLift,
          backgroundColor: colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          display: sheetOpen ? 'none' : 'flex',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon Icon={Home} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses/index"
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon Icon={ReceiptText} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon Icon={Settings} color={color} />,
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

const styles = StyleSheet.create({});
