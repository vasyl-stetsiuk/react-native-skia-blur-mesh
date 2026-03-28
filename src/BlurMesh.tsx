import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
  type LayoutChangeEvent,
} from 'react-native';
import {
  Canvas,
  Group,
  Oval,
  RoundedRect,
  Rect,
  Blur,
  Skia,
} from '@shopify/react-native-skia';

import type {
  BlurMeshProps,
  ShapeItem,
  BlurredShapeType,
} from './types';

const pixelRatio = PixelRatio.get();

/**
 * Degrees → radians.
 */
const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Renders a single blurred shape on the Skia canvas.
 */
const BlurredShape: React.FC<{
  item: ShapeItem;
  blurRadius: number;
}> = ({ item, blurRadius }) => {
  const { color, size, rotate, topLeft, shape = { kind: 'oval' } } = item;

  const paint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    return p;
  }, [color]);

  const pivotX = topLeft.x + size.width / 2;
  const pivotY = topLeft.y + size.height / 2;

  const transform = rotate !== 0 ? [{ rotate: degToRad(rotate) }] : undefined;
  const origin = rotate !== 0 ? { x: pivotX, y: pivotY } : undefined;

  // Adjust blur for pixel density
  const adjustedBlur = blurRadius / pixelRatio;
  const blurChild = adjustedBlur > 0 ? <Blur blur={adjustedBlur} /> : null;

  const shapeElement = useMemo(() => {
    switch (shape.kind) {
      case 'oval':
        return (
          <Oval
            x={topLeft.x}
            y={topLeft.y}
            width={size.width}
            height={size.height}
            paint={paint}
          >
            {blurChild}
          </Oval>
        );

      case 'roundedRect':
        return (
          <RoundedRect
            x={topLeft.x}
            y={topLeft.y}
            width={size.width}
            height={size.height}
            r={shape.rx}
            paint={paint}
          >
            {blurChild}
          </RoundedRect>
        );

      case 'rect':
      default:
        return (
          <Rect
            x={topLeft.x}
            y={topLeft.y}
            width={size.width}
            height={size.height}
            paint={paint}
          >
            {blurChild}
          </Rect>
        );
    }
  }, [shape, topLeft, size, paint, blurChild]);

  if (rotate !== 0) {
    return (
      <Group transform={transform} origin={origin}>
        {shapeElement}
      </Group>
    );
  }

  return shapeElement;
};

/**
 * `<BlurMesh>` — Blurred color mesh backgrounds.
 *
 * Renders colored, blurred shapes behind `children`, creating
 * soft gradient-like effects. Shapes are defined in a Figma-relative
 * coordinate system (`srcSize`) and automatically scaled to fit
 * the actual component dimensions.
 *
 * Powered by `@shopify/react-native-skia`.
 *
 * @example
 * ```tsx
 * import { BlurMesh } from 'react-native-skia-blur-mesh';
 *
 * <BlurMesh
 *   width={343}
 *   height={146}
 *   srcSize={{ width: 343, height: 146 }}
 *   shapeItems={[
 *     {
 *       color: 'rgba(176,178,255,0.6)',
 *       size: { width: 595, height: 265 },
 *       rotate: 0,
 *       topLeft: { x: -85, y: -113 },
 *     },
 *     {
 *       color: '#DE67D2',
 *       size: { width: 380, height: 200 },
 *       rotate: 0,
 *       topLeft: { x: 36, y: 139 },
 *     },
 *   ]}
 * >
 *   <YourContent />
 * </BlurMesh>
 * ```
 */
const BlurMesh: React.FC<BlurMeshProps> = ({
  shapeItems,
  srcSize,
  defaultBlurRadius = 185,
  initialOffset = { x: 0, y: 0 },
  width: _width,
  height: _height,
  style,
  children,
}) => {
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  };

  const width = _width ?? layout?.width ?? 0;
  const height = _height ?? layout?.height ?? 0;

  // ── Blur radius distribution ──────────────────────────────────
  const resolvedBlurs = useMemo(() => {
    const radii = shapeItems.map((it) => it.blurRadius ?? defaultBlurRadius);
    const minBlur = Math.min(...radii);
    return {
      perShape: radii.map((r) => r - minBlur),
      shared: minBlur,
    };
  }, [shapeItems, defaultBlurRadius]);

  // ── Scaling math ──────────────────────────────────────────────
  const { scale, offsetX, offsetY } = useMemo(() => {
    if (srcSize.width === 0) return { scale: 1, offsetX: 0, offsetY: 0 };
    const s = width / srcSize.width;
    const diffW = width - srcSize.width;
    const diffH = height - srcSize.height;
    return { scale: s, offsetX: diffW / 2, offsetY: diffH / 2 };
  }, [width, height, srcSize]);

  const hasSize = width > 0 && height > 0;

  return (
    <View
      style={[styles.container, { width: _width, height: _height }, style]}
      onLayout={onLayout}
    >
      {hasSize && (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group
            transform={[
              { scale },
              { translateX: offsetX },
              { translateY: offsetY },
            ]}
            origin={{ x: srcSize.width / 2, y: srcSize.height / 2 }}
          >
            <Group
              transform={[
                { translateX: initialOffset.x },
                { translateY: initialOffset.y },
              ]}
            >
              {[...shapeItems].reverse().map((item, idx) => {
                const originalIdx = shapeItems.length - 1 - idx;
                return (
                  <BlurredShape
                    key={`blurred-shape-${originalIdx}`}
                    item={item}
                    blurRadius={
                      resolvedBlurs.shared +
                      resolvedBlurs.perShape[originalIdx]
                    }
                  />
                );
              })}
            </Group>
          </Group>
        </Canvas>
      )}

      {children && <View style={StyleSheet.absoluteFill}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default BlurMesh;
export { BlurMesh };
