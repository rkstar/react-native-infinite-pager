"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = exports.Preset = exports.DEFAULT_ANIMATION_CONFIG = void 0;

var _react = _interopRequireWildcard(require("react"));

var _reactNative = require("react-native");

var _reactNativeReanimated = _interopRequireWildcard(
  require("react-native-reanimated")
);

var _reactNativeGestureHandler = require("react-native-gesture-handler");

var _pageInterpolators = require("./pageInterpolators");

function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}

function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

let Preset;
exports.Preset = Preset;

(function (Preset) {
  Preset["SLIDE"] = "slide";
  Preset["CUBE"] = "cube";
  Preset["STACK"] = "stack";
  Preset["TURN_IN"] = "turn-in";
})(Preset || (exports.Preset = Preset = {}));

const PageInterpolators = {
  [Preset.SLIDE]: _pageInterpolators.pageInterpolatorSlide,
  [Preset.CUBE]: _pageInterpolators.pageInterpolatorCube,
  [Preset.STACK]: _pageInterpolators.pageInterpolatorStack,
  [Preset.TURN_IN]: _pageInterpolators.pageInterpolatorTurnIn,
};
const DEFAULT_ANIMATION_CONFIG = {
  damping: 20,
  mass: 0.2,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 0.2,
  restDisplacementThreshold: 0.2,
};
exports.DEFAULT_ANIMATION_CONFIG = DEFAULT_ANIMATION_CONFIG;

function InfinitePager(
  {
    vertical = false,
    PageComponent,
    pageCallbackNode,
    onPageChange,
    pageBuffer = 1,
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
  const pageWidth = (0, _reactNativeReanimated.useSharedValue)(0);
  const pageHeight = (0, _reactNativeReanimated.useSharedValue)(0);
  const pageSize = vertical ? pageHeight : pageWidth;
  const translateX = (0, _reactNativeReanimated.useSharedValue)(0);
  const translateY = (0, _reactNativeReanimated.useSharedValue)(0);
  const translate = vertical ? translateY : translateX;
  const [curIndex, setCurIndex] = (0, _react.useState)(0);
  const pageAnimInternal = (0, _reactNativeReanimated.useSharedValue)(0);
  const pageAnim = pageCallbackNode || pageAnimInternal;
  const pageInterpolatorRef = (0, _react.useRef)(pageInterpolator);
  pageInterpolatorRef.current = pageInterpolator;
  const curIndexRef = (0, _react.useRef)(curIndex);
  curIndexRef.current = curIndex;
  const animCfgRef = (0, _react.useRef)(animationConfig);
  animCfgRef.current = animationConfig;
  const setPage = (0, _react.useCallback)(
    (index, options = {}) => {
      const updatedTranslate = index * pageSize.value * -1;

      if (options.animated) {
        const animCfg = { ...DEFAULT_ANIMATION_CONFIG, ...animCfgRef.current };
        translate.value = (0, _reactNativeReanimated.withSpring)(
          updatedTranslate,
          animCfg
        );
      } else {
        translate.value = updatedTranslate;
      }
    },
    [pageSize, translate]
  );
  (0, _react.useImperativeHandle)(
    ref,
    () => ({
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
  (0, _reactNativeReanimated.useDerivedValue)(() => {
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

  (0, _reactNativeReanimated.useAnimatedReaction)(
    () => {
      return Math.round(pageAnim.value);
    },
    (cur, prev) => {
      if (cur !== prev) {
        (0, _reactNativeReanimated.runOnJS)(onPageChangeInternal)(cur);
      }
    },
    []
  );
  const startTranslate = (0, _reactNativeReanimated.useSharedValue)(0);

  const panGesture = _reactNativeGestureHandler.Gesture.Pan()
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
      translate.value = (0, _reactNativeReanimated.withSpring)(
        -page * pageSize.value,
        animCfg
      );
    })
    .enabled(!gesturesDisabled);

  return /*#__PURE__*/ _react.default.createElement(
    _reactNativeGestureHandler.GestureDetector,
    {
      gesture: _reactNativeGestureHandler.Gesture.Simultaneous(
        panGesture,
        ...simultaneousGestures
      ),
    },
    /*#__PURE__*/ _react.default.createElement(
      _reactNativeReanimated.default.View,
      {
        style: style,
        onLayout: ({ nativeEvent: { layout } }) => {
          pageWidth.value = layout.width;
          pageHeight.value = layout.height;
        },
      },
      pageIndices.map((pageIndex) => {
        return /*#__PURE__*/ _react.default.createElement(PageWrapper, {
          key: `page-provider-wrapper-${pageIndex}`,
          vertical: vertical,
          pageAnim: pageAnim,
          index: pageIndex,
          pageWidth: pageWidth,
          pageHeight: pageHeight,
          isActive: pageIndex === curIndex,
          isAdjacentToActive: Math.abs(pageIndex - curIndex) === 1,
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

const PageWrapper = /*#__PURE__*/ _react.default.memo(
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
    const translation = (0, _reactNativeReanimated.useDerivedValue)(() => {
      const translateX = (index - pageAnim.value) * pageSize.value;
      return translateX;
    }, []);
    const focusAnim = (0, _reactNativeReanimated.useDerivedValue)(() => {
      if (!pageSize.value) return 99999;
      return translation.value / pageSize.value;
    }, []);
    const animStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
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

    return /*#__PURE__*/ _react.default.createElement(
      _reactNativeReanimated.default.View,
      {
        style: [
          style,
          styles.pageWrapper,
          animStyle,
          isActive && styles.activePage,
        ],
      },
      PageComponent
        ? /*#__PURE__*/ _react.default.createElement(PageComponent, {
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

var _default = /*#__PURE__*/ _react.default.memo(
  /*#__PURE__*/ _react.default.forwardRef(InfinitePager)
);

exports.default = _default;

const styles = _reactNative.StyleSheet.create({
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
