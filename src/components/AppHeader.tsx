import { useRouter } from 'expo-router';
import { Bell, UserRound } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../hooks/useProfile';
import { BRAND_FONT_FAMILY } from '../theme/fonts';
import { useAppTheme } from '../theme/ThemeContext';

const beanLogo = require('../../assets/bean/bean-icon-foreground 1.png');

export function HeaderAvatar() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const { profile } = useProfile();
  const photoUri = profile?.photoUri;

  return (
    <Pressable
      accessibilityLabel="Open profile"
      accessibilityRole="button"
      onPress={() => router.push('/profile')}
      style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.avatarImage} />
      ) : (
        <UserRound color={colors.primary} size={21} strokeWidth={2.5} />
      )}
    </Pressable>
  );
}

export function HeaderBrand() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View accessibilityLabel="Bean" style={styles.brandWrap}>
      <Image source={beanLogo} style={styles.logo} />
      <Text style={styles.wordmark}>Bean</Text>
    </View>
  );
}

export function HeaderBell() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <Pressable
      accessibilityLabel="Notifications"
      accessibilityRole="button"
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Bell color={colors.text} size={21} strokeWidth={2.45} />
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
    avatarButton: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderColor: colors.primarySoftBorder,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 38,
      justifyContent: 'center',
      marginLeft: 16,
      overflow: 'hidden',
      width: 38,
    },
    avatarImage: {
      height: '100%',
      resizeMode: 'cover',
      width: '100%',
    },
    brandWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
    },
    logo: {
      height: 30,
      resizeMode: 'contain',
      width: 30,
    },
    wordmark: {
      color: colors.text,
      fontFamily: BRAND_FONT_FAMILY,
      fontSize: 25,
      letterSpacing: -0.4,
      lineHeight: 31,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 38,
      justifyContent: 'center',
      marginRight: 16,
      width: 38,
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.98 }],
    },
  });
}
