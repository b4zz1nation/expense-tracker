import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BRAND_FONT_FAMILY } from '../theme/fonts';
import { useAppTheme } from '../theme/ThemeContext';

const beanLogo = require('../../assets/bean/bean-icon-foreground 1.png');

type Props = {
  ready: boolean;
  onFinish: () => void;
};

export function LaunchSplash({ ready, onFinish }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [introComplete, setIntroComplete] = useState(false);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 680,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 15,
        mass: 0.7,
        stiffness: 115,
        useNativeDriver: true,
      }),
    ]);

    intro.start(({ finished }) => {
      if (finished) setIntroComplete(true);
    });

    return () => intro.stop();
  }, [brandOpacity, logoScale]);

  useEffect(() => {
    if (!introComplete || !ready) return;

    const exit = Animated.sequence([
      Animated.delay(260),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 460,
        useNativeDriver: true,
      }),
    ]);

    exit.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => exit.stop();
  }, [introComplete, onFinish, ready, screenOpacity]);

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: screenOpacity }]}>
      <View style={styles.brandGroup}>
        <Animated.Image source={beanLogo} style={[styles.logo, { opacity: brandOpacity, transform: [{ scale: logoScale }] }]} />
        <Animated.Text style={[styles.wordmark, { opacity: brandOpacity }]}>Bean</Animated.Text>
      </View>
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
    overlay: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      alignItems: 'center',
      backgroundColor: colors.background,
      justifyContent: 'center',
      zIndex: 1000,
    },
    brandGroup: {
      alignItems: 'center',
      gap: 12,
      justifyContent: 'center',
    },
    logo: {
      height: 118,
      resizeMode: 'contain',
      width: 118,
    },
    wordmark: {
      color: colors.text,
      fontFamily: BRAND_FONT_FAMILY,
      fontSize: 34,
      letterSpacing: -0.6,
      lineHeight: 43,
    },
  });
}
