import { Animated, Easing } from 'react-native';

export const createFadeIn = (animatedValue: Animated.Value) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration: 500,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

export const createScaleIn = (animatedValue: Animated.Value) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 4,
    tension: 40,
    useNativeDriver: true,
  });
};

export const createSlideUp = (animatedValue: Animated.Value) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration: 400,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createPulse = (animatedValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.1,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
  ]);
};