import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeContext';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  keyboardAware?: boolean;
}>;

export function Screen({ children, scroll = true, keyboardAware = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const containerStyle = [styles.container, { paddingBottom: 32 + insets.bottom }];

  if (!scroll) {
    return <View style={containerStyle}>{children}</View>;
  }

  if (!keyboardAware) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={containerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        nestedScrollEnabled
        scrollEventThrottle={16}
        overScrollMode="always"
        bounces
        alwaysBounceVertical
        directionalLockEnabled
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={containerStyle}
      enableOnAndroid
      extraScrollHeight={Platform.OS === 'android' ? 140 : 24}
      extraHeight={Platform.OS === 'android' ? 160 : 88}
      keyboardOpeningTime={0}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
      enableResetScrollToCoords={false}
      nestedScrollEnabled
      scrollEventThrottle={16}
      overScrollMode="always"
      bounces
      alwaysBounceVertical
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1,
      padding: spacing.screen,
      gap: spacing.lg,
      backgroundColor: colors.background,
    },
  });
}
