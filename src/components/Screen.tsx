import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const containerStyle = [styles.container, { paddingBottom: 32 + insets.bottom }];

  if (!scroll) {
    return <View style={containerStyle}>{children}</View>;
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
      overScrollMode="never"
      bounces={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#F8FAFC',
  },
});
