import { useEffect, useRef } from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { useThemeColor } from "heroui-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

export default function LoadingScreen({ onAnimationComplete }) {
  const { width } = useWindowDimensions();
  const [background, foreground, muted, accent, surface, border] =
    useThemeColor([
      "background",
      "foreground",
      "muted",
      "accent",
      "surface",
      "border",
    ]);
  const reduceMotion = useReducedMotion();
  const callbackRef = useRef(onAnimationComplete);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);
  const dividerProgress = useSharedValue(0);
  const universityOpacity = useSharedValue(0);
  const universityTranslateY = useSharedValue(24);
  const appNameOpacity = useSharedValue(0);
  const appNameTranslateY = useSharedValue(28);
  const badgeOpacity = useSharedValue(0);
  const badgeTranslateY = useSharedValue(20);
  const progress = useSharedValue(0);

  useEffect(() => {
    callbackRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    const complete = () => {
      if (typeof callbackRef.current === "function") {
        callbackRef.current();
      }
    };

    if (reduceMotion) {
      logoOpacity.value = 1;
      logoScale.value = 1;
      universityOpacity.value = 1;
      universityTranslateY.value = 0;
      appNameOpacity.value = 1;
      appNameTranslateY.value = 0;
      badgeOpacity.value = 1;
      badgeTranslateY.value = 0;
      dividerProgress.value = 1;
      progress.value = withTiming(1, { duration: 50 }, (finished) => {
        if (finished) runOnJS(complete)();
      });
      return;
    }

    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSequence(
      withSpring(1, {
        damping: 14,
        stiffness: 90,
        mass: 1,
        overshootClamping: false,
      }),
      withDelay(600, withTiming(0.65, { duration: 900 })),
    );
    logoTranslateY.value = withDelay(
      1300,
      withTiming(-55, { duration: 900 }),
    );

    dividerProgress.value = withDelay(
      1300,
      withTiming(1, { duration: 900 }),
    );

    universityOpacity.value = withDelay(
      1700,
      withTiming(1, { duration: 850 }),
    );
    universityTranslateY.value = withDelay(
      1700,
      withTiming(0, { duration: 850 }),
    );

    appNameOpacity.value = withDelay(
      1900,
      withTiming(1, { duration: 800 }),
    );
    appNameTranslateY.value = withDelay(
      1900,
      withTiming(0, { duration: 800 }),
    );

    badgeOpacity.value = withDelay(
      2100,
      withTiming(1, { duration: 700 }),
    );
    badgeTranslateY.value = withDelay(
      2100,
      withTiming(0, { duration: 700 }),
    );

    progress.value = withDelay(
      2150,
      withTiming(1, { duration: 1900 }, (finished) => {
        if (finished) runOnJS(complete)();
      }),
    );
  }, [
    reduceMotion,
    appNameOpacity,
    appNameTranslateY,
    badgeOpacity,
    badgeTranslateY,
    dividerProgress,
    logoOpacity,
    logoScale,
    logoTranslateY,
    progress,
    universityOpacity,
    universityTranslateY,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
    ],
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    width: width * 0.55 * dividerProgress.value,
  }));

  const universityStyle = useAnimatedStyle(() => ({
    opacity: universityOpacity.value,
    transform: [{ translateY: universityTranslateY.value }],
  }));

  const appNameStyle = useAnimatedStyle(() => ({
    opacity: appNameOpacity.value,
    transform: [{ translateY: appNameTranslateY.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ translateY: badgeTranslateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: width * 0.72 * progress.value,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading UOM Lost and Found"
      accessibilityValue={{ min: 0, max: 100 }}
      style={[styles.container, { backgroundColor: background }]}
    >
      <View style={styles.logoZone}>
        <Animated.View style={[styles.logoFrame, logoStyle]}>
          <Svg
            width={224}
            height={224}
            viewBox="0 0 224 224"
            style={styles.crestRing}
          >
            <Circle
              cx="112"
              cy="112"
              r="104"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              opacity="0.28"
            />
            <Circle
              cx="112"
              cy="112"
              r="96"
              fill="none"
              stroke={accent}
              strokeWidth="0.75"
              opacity="0.12"
            />
          </Svg>
          <Image
            source={require("../../assets/uom-logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="University of Moratuwa emblem"
          />
        </Animated.View>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[styles.divider, dividerStyle, { backgroundColor: accent }]}
        />
        <Animated.Text
          style={[styles.universityName, universityStyle, { color: muted }]}
        >
          University of Moratuwa
        </Animated.Text>
        <Animated.Text
          style={[styles.appName, appNameStyle, { color: foreground }]}
        >
          Lost &amp; Found
        </Animated.Text>
        <Animated.View
          style={[
            styles.badge,
            badgeStyle,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          <Animated.Text style={[styles.badgeText, { color: muted }]}>
            Loading your campus workspace
          </Animated.Text>
        </Animated.View>
      </View>

      <View style={styles.progressArea}>
        <View
          style={[
            styles.progressTrack,
            { width: width * 0.72, backgroundColor: border },
          ]}
        >
          <Animated.View
            style={[styles.progressFill, progressStyle, { backgroundColor: accent }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoZone: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "27%",
    alignItems: "center",
  },
  logoFrame: {
    width: 224,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
  },
  crestRing: {
    position: "absolute",
  },
  logo: {
    width: 194,
    height: 194,
  },
  content: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "52%",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginBottom: 22,
  },
  universityName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  appName: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 8,
    textAlign: "center",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  progressArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 44,
    alignItems: "center",
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 999,
  },
});
