import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  WithSpringConfig,
} from "react-native-reanimated";
import { ComposedGesture, GestureType } from "react-native-gesture-handler";
import { defaultPageInterpolator } from "./pageInterpolators";
export declare enum Preset {
  SLIDE = "slide",
  CUBE = "cube",
  STACK = "stack",
  TURN_IN = "turn-in",
}
export declare const DEFAULT_ANIMATION_CONFIG: WithSpringConfig;
declare type PageProps = {
  index: number;
  focusAnim: Animated.DerivedValue<number>;
  isActive: boolean;
  isAdjacentToActive: boolean;
  pageWidthAnim: Animated.SharedValue<number>;
  pageHeightAnim: Animated.SharedValue<number>;
  pageAnim: Animated.SharedValue<number>;
};
declare type PageComponentType = (props: PageProps) => JSX.Element | null;
declare type AnyStyle =
  | StyleProp<ViewStyle>
  | ReturnType<typeof useAnimatedStyle>;
declare type Props = {
  vertical?: boolean;
  PageComponent?:
    | PageComponentType
    | React.MemoExoticComponent<PageComponentType>;
  renderPage?: PageComponentType;
  pageCallbackNode?: Animated.SharedValue<number>;
  onPageChange?: (page: number) => void;
  pageBuffer?: number;
  style?: AnyStyle;
  pageWrapperStyle?: AnyStyle;
  pageInterpolator?: typeof defaultPageInterpolator;
  minIndex?: number;
  maxIndex?: number;
  simultaneousGestures?: (ComposedGesture | GestureType)[];
  gesturesDisabled?: boolean;
  animationConfig?: Partial<WithSpringConfig>;
  flingVelocity?: number;
  preset?: Preset;
};
declare type ImperativeApiOptions = {
  animated?: boolean;
};
export declare type InfinitePagerImperativeApi = {
  setPage: (index: number, options: ImperativeApiOptions) => void;
  incrementPage: (options: ImperativeApiOptions) => void;
  decrementPage: (options: ImperativeApiOptions) => void;
};
export declare type PageInterpolatorParams = {
  index: number;
  vertical: boolean;
  focusAnim: Animated.DerivedValue<number>;
  pageAnim: Animated.DerivedValue<number>;
  pageWidth: Animated.SharedValue<number>;
  pageHeight: Animated.SharedValue<number>;
  pageBuffer: number;
};
declare const _default: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<
    Props & React.RefAttributes<InfinitePagerImperativeApi>
  >
>;
export default _default;
