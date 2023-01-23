import React, {
  useState,
  useImperativeHandle,
  useCallback,
  useRef,
} from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  pageInterpolatorCube,
  pageInterpolatorSlide,
  pageInterpolatorStack,
  pageInterpolatorTurnIn,
} from "./pageInterpolators";
export let Preset;

(function (Preset) {
  Preset["SLIDE"] = "slide";
  Preset["CUBE"] = "cube";
  Preset["STACK"] = "stack";
  Preset["TURN_IN"] = "turn-in";
})(Preset || (Preset = {}));

const PageInterpolators = {
  [Preset.SLIDE]: pageInterpolatorSlide,
  [Preset.CUBE]: pageInterpolatorCube,
  [Preset.STACK]: pageInterpolatorStack,
  [Preset.TURN_IN]: pageInterpolatorTurnIn,
};
export const DEFAULT_ANIMATION_CONFIG = {
  damping: 20,
  mass: 0.2,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 0.2,
  restDisplacementThreshold: 0.2,
};

function InfinitePager(
  {
    vertical = false,
    PageComponent,
    pageCallbackNode,
    onPageChange,
    pageBuffer = 1,
    updatePagesInBuffer,
    style,
    pageWrapperStyle,
    minIndex = -Infinity,
    maxIndex = Infinity,
    simultaneousGestures = [],
    gesturesDisabled,
    animationConfig = {},
    renderPage,
    flingVelocity = 500,
    preset = Preset.SLIDE,
    pageInterpolator = PageInterpolators[preset],
  },
  ref
) {
  const pageWidth = useSharedValue(0);
  const pageHeight = useSharedValue(0);
  const pageSize = vertical ? pageHeight : pageWidth;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translate = vertical ? translateY : translateX;
  const [curIndex, setCurIndex] = useState(0);
  const pageAnimInternal = useSharedValue(0);
  const pageAnim = pageCallbackNode || pageAnimInternal;
  const pageInterpolatorRef = useRef(pageInterpolator);
  pageInterpolatorRef.current = pageInterpolator;
  const curIndexRef = useRef(curIndex);
  curIndexRef.current = curIndex;
  const animCfgRef = useRef(animationConfig);
  animCfgRef.current = animationConfig;
  const setPage = useCallback(
    (index, options = {}) => {
      const updatedTranslate = index * pageSize.value * -1;

      if (options.animated) {
        const animCfg = { ...DEFAULT_ANIMATION_CONFIG, ...animCfgRef.current };
        translate.value = withSpring(updatedTranslate, animCfg);
      } else {
        translate.value = updatedTranslate;
      }
    },
    [pageSize, translate]
  );
  useImperativeHandle(
    ref,
    () => ({
      getCurrentPage: () => curIndexRef.current,
      setPage,
      incrementPage: (options) => {
        setPage(curIndexRef.current + 1, options);
      },
      decrementPage: (options) => {
        setPage(curIndexRef.current - 1, options);
      },
    }),
    [setPage]
  );
  const pageIndices = [...Array(pageBuffer * 2 + 1)].map((_, i) => {
    const bufferIndex = i - pageBuffer;
    return curIndex - bufferIndex;
  });
  useDerivedValue(() => {
    if (pageSize.value) {
      pageAnim.value = (translate.value / pageSize.value) * -1;
    }
  }, [pageSize, pageAnim, translate]);

  function onPageChangeInternal(pg) {
    onPageChange === null || onPageChange === void 0
      ? void 0
      : onPageChange(pg);
    setCurIndex(pg);
  }

  useAnimatedReaction(
    () => {
      return Math.round(pageAnim.value);
    },
    (cur, prev) => {
      if (cur !== prev) {
        runOnJS(onPageChangeInternal)(cur);
      }
    },
    []
  );
  const startTranslate = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startTranslate.value = translate.value;
    })
    .onUpdate((evt) => {
      const evtTranslate = vertical ? evt.translationY : evt.translationX;
      const rawVal = startTranslate.value + evtTranslate;
      const page = -rawVal / pageSize.value;

      if (page >= minIndex && page <= maxIndex) {
        translate.value = rawVal;
      }
    })
    .onEnd((evt) => {
      const evtVelocity = vertical ? evt.velocityY : evt.velocityX;
      const isFling = Math.abs(evtVelocity) > flingVelocity;
      let velocityModifier = isFling ? pageSize.value / 2 : 0;
      if (evtVelocity < 0) velocityModifier *= -1;
      let page =
        -1 * Math.round((translate.value + velocityModifier) / pageSize.value);
      if (page < minIndex) page = minIndex;
      if (page > maxIndex) page = maxIndex;
      const animCfg = Object.assign(
        {},
        DEFAULT_ANIMATION_CONFIG,
        animCfgRef.current
      );
      translate.value = withSpring(-page * pageSize.value, animCfg);
    })
    .enabled(!gesturesDisabled);
  return /*#__PURE__*/ React.createElement(
    GestureDetector,
    {
      gesture: Gesture.Simultaneous(panGesture, ...simultaneousGestures),
    },
    /*#__PURE__*/ React.createElement(
      Animated.View,
      {
        style: style,
        onLayout: ({ nativeEvent: { layout } }) => {
          pageWidth.value = layout.width;
          pageHeight.value = layout.height;
        },
      },
      pageIndices.map((pageIndex) => {
        return /*#__PURE__*/ React.createElement(PageWrapper, {
          key: `page-provider-wrapper-${pageIndex}`,
          vertical: vertical,
          pageAnim: pageAnim,
          index: pageIndex,
          pageWidth: pageWidth,
          pageHeight: pageHeight,
          isActive: pageIndex === curIndex,
          isAdjacentToActive: updatePagesInBuffer
            ? Math.abs(pageIndex - curIndex) <= updatePagesInBuffer
            : false,
          PageComponent: PageComponent,
          renderPage: renderPage,
          style: pageWrapperStyle,
          pageInterpolatorRef: pageInterpolatorRef,
          pageBuffer: pageBuffer,
        });
      })
    )
  );
}

const PageWrapper = /*#__PURE__*/ React.memo(
  ({
    index,
    pageAnim,
    pageWidth,
    pageHeight,
    vertical,
    PageComponent,
    renderPage,
    isActive,
    isAdjacentToActive,
    style,
    pageInterpolatorRef,
    pageBuffer,
  }) => {
    const pageSize = vertical ? pageHeight : pageWidth;
    const translation = useDerivedValue(() => {
      const translateX = (index - pageAnim.value) * pageSize.value;
      return translateX;
    }, []);
    const focusAnim = useDerivedValue(() => {
      if (!pageSize.value) return 99999;
      return translation.value / pageSize.value;
    }, []);
    const animStyle = useAnimatedStyle(() => {
      // Short circuit page interpolation to prevent buggy initial values due to possible race condition:
      // https://github.com/software-mansion/react-native-reanimated/issues/2571
      const isInactivePageBeforeInit = index !== 0 && !pageSize.value;

      const _pageWidth = isInactivePageBeforeInit ? focusAnim : pageWidth;

      const _pageHeight = isInactivePageBeforeInit ? focusAnim : pageHeight;

      return pageInterpolatorRef.current({
        focusAnim,
        pageAnim,
        pageWidth: _pageWidth,
        pageHeight: _pageHeight,
        index,
        vertical,
        pageBuffer,
      });
    }, [
      pageWidth,
      pageHeight,
      pageAnim,
      index,
      translation,
      vertical,
      pageBuffer,
    ]);

    if (PageComponent && renderPage) {
      console.warn(
        "PageComponent and renderPage both defined, defaulting to PageComponent"
      );
    }

    if (!PageComponent && !renderPage) {
      throw new Error("Either PageComponent or renderPage must be defined.");
    }

    return /*#__PURE__*/ React.createElement(
      Animated.View,
      {
        style: [
          style,
          styles.pageWrapper,
          animStyle,
          isActive && styles.activePage,
        ],
      },
      PageComponent
        ? /*#__PURE__*/ React.createElement(PageComponent, {
            index: index,
            isActive: isActive,
            isAdjacentToActive: isAdjacentToActive,
            focusAnim: focusAnim,
            pageWidthAnim: pageWidth,
            pageHeightAnim: pageHeight,
            pageAnim: pageAnim,
          })
        : renderPage === null || renderPage === void 0
        ? void 0
        : renderPage({
            index,
            isActive,
            isAdjacentToActive,
            focusAnim,
            pageWidthAnim: pageWidth,
            pageHeightAnim: pageHeight,
            pageAnim,
          })
    );
  }
);
export default /*#__PURE__*/ React.memo(
  /*#__PURE__*/ React.forwardRef(InfinitePager)
);
const styles = StyleSheet.create({
  pageWrapper: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: "absolute",
  },
  activePage: {
    position: "relative",
  },
});
//# sourceMappingURL=index.js.map
