import React, {useMemo, useState} from 'react';
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
import {useDerivedValue} from 'react-native-reanimated';

import type {
    Animatable,
    BlurMeshProps,
    ShapeItem,
} from './types';

const pixelRatio = PixelRatio.get();

// ── Helpers ─────────────────────────────────────────────────────

const readNum = (v: Animatable<number> | undefined, fallback: number): number => {
    'worklet';
    if (v === undefined || v === null) return fallback;
    if (typeof v === 'number') return v;
    return v.value;
};

const readStr = (v: Animatable<string> | undefined, fallback: string): string => {
    'worklet';
    if (v === undefined || v === null) return fallback;
    if (typeof v === 'string') return v;
    return v.value;
};

const isAnimated = (v: any): boolean =>
    v !== undefined && v !== null && typeof v === 'object' && 'value' in v;

const degToRad = (deg: number): number => {
    'worklet';
    return (deg * Math.PI) / 180;
};

// ── Blurred shape layer ─────────────────────────────────────────

const BlurredShape: React.FC<{
    item: ShapeItem;
    blurRadius: number;
}> = ({item, blurRadius: defaultBlur}) => {
    const {
        color,
        size,
        rotate,
        topLeft,
        shape = {kind: 'oval'},
        blurRadius: itemBlur,
    } = item;

    // ── Resolve blur ──────────────────────────────────────────────
    const effectiveBlur = itemBlur ?? defaultBlur;

    const derivedBlur = useDerivedValue(() => {
        return readNum(effectiveBlur, defaultBlur) / pixelRatio;
    }, [effectiveBlur, defaultBlur]);

    // ── Animated color ────────────────────────────────────────────
    const isColorAnimated = isAnimated(color);

    const staticPaint = useMemo(() => {
        if (isColorAnimated) return null;
        const p = Skia.Paint();
        p.setColor(Skia.Color(color as string));
        return p;
    }, [color, isColorAnimated]);

    const animatedColor = useDerivedValue(() => {
        return Skia.Color(readStr(color, '#000000'));
    }, [color]);

    // ── Animated position ─────────────────────────────────────────
    const derivedX = useDerivedValue(() => readNum(topLeft.x, 0), [topLeft.x]);
    const derivedY = useDerivedValue(() => readNum(topLeft.y, 0), [topLeft.y]);

    // ── Animated size ─────────────────────────────────────────────
    const derivedWidth = useDerivedValue(() => readNum(size.width, 0), [size.width]);
    const derivedHeight = useDerivedValue(() => readNum(size.height, 0), [size.height]);

    // ── Animated rotation ─────────────────────────────────────────
    const rotateTransform = useDerivedValue(() => {
        const r = readNum(rotate, 0);
        if (r === 0) return [];
        return [{rotate: degToRad(r)}];
    }, [rotate]);

    const rotateOrigin = useDerivedValue(() => {
        const x = readNum(topLeft.x, 0);
        const y = readNum(topLeft.y, 0);
        const w = readNum(size.width, 0);
        const h = readNum(size.height, 0);
        return {x: x + w / 2, y: y + h / 2};
    }, [topLeft.x, topLeft.y, size.width, size.height]);

    // ── Animated border radius (for roundedRect) ──────────────────
    const derivedRx = useDerivedValue(() => {
        if (shape.kind === 'roundedRect') {
            return readNum(shape.rx, 0);
        }
        return 0;
    }, [shape]);

    // ── Color props ───────────────────────────────────────────────
    const colorProps = isColorAnimated
        ? {color: animatedColor}
        : {paint: staticPaint!};

    // ── Shape element ─────────────────────────────────────────────
    const shapeElement = useMemo(() => {
        const blurChild = <Blur blur={derivedBlur}/>;

        switch (shape.kind) {
            case 'oval':
                return (
                    <Oval
                        x={derivedX} y={derivedY}
                        width={derivedWidth} height={derivedHeight}
                        {...colorProps}
                    >
                        {blurChild}
                    </Oval>
                );

            case 'roundedRect':
                return (
                    <RoundedRect
                        x={derivedX} y={derivedY}
                        width={derivedWidth} height={derivedHeight}
                        r={derivedRx}
                        {...colorProps}
                    >
                        {blurChild}
                    </RoundedRect>
                );

            case 'rect':
            default:
                return (
                    <Rect
                        x={derivedX} y={derivedY}
                        width={derivedWidth} height={derivedHeight}
                        {...colorProps}
                    >
                        {blurChild}
                    </Rect>
                );
        }
    }, [
        shape, derivedX, derivedY, derivedWidth, derivedHeight,
        derivedBlur, derivedRx, colorProps,
    ]);

    return (
        <Group transform={rotateTransform} origin={rotateOrigin}>
            {shapeElement}
        </Group>
    );
};

// ── Main BlurMesh component ─────────────────────────────────────

/**
 * `<BlurMesh>` — Blurred color mesh backgrounds.
 *
 * Renders colored, blurred shapes behind `children`, creating
 * soft gradient-like effects. Shapes are defined in a Figma-relative
 * coordinate system (`srcSize`) and automatically scaled to fit
 * the actual component dimensions.
 *
 * All numeric props and color in `ShapeItem` accept both static values
 * and Reanimated `SharedValue` for 60fps UI-thread animations.
 *
 * @example Static
 * ```tsx
 * <BlurMesh
 *   srcSize={{ width: 343, height: 146 }}
 *   defaultBlurRadius={185}
 *   shapeItems={[
 *     { color: '#B0B2FF', size: { width: 595, height: 265 },
 *       rotate: 0, topLeft: { x: -85, y: -113 } },
 *   ]}
 * >
 *   <Text>Content</Text>
 * </BlurMesh>
 * ```
 *
 * @example Animated
 * ```tsx
 * const x = useSharedValue(-85);
 * const color = useSharedValue('rgba(176, 178, 255, 0.6)');
 *
 * useEffect(() => {
 *   x.value = withRepeat(withTiming(50, { duration: 3000 }), -1, true);
 *   color.value = withRepeat(
 *     withTiming('rgba(255, 100, 200, 0.6)', { duration: 3000 }), -1, true,
 *   );
 * }, []);
 *
 * <BlurMesh
 *   srcSize={{ width: 343, height: 146 }}
 *   defaultBlurRadius={185}
 *   shapeItems={[
 *     { color, size: { width: 595, height: 265 },
 *       rotate: 0, topLeft: { x, y: -113 } },
 *   ]}
 * >
 *   <Text>Animated mesh</Text>
 * </BlurMesh>
 * ```
 */
const BlurMesh: React.FC<BlurMeshProps> = ({
                                               shapeItems,
                                               srcSize,
                                               defaultBlurRadius = 185,
                                               initialOffset = {x: 0, y: 0},
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
        const {width, height} = e.nativeEvent.layout;
        setLayout({width, height});
    };

    const width = _width ?? layout?.width ?? 0;
    const height = _height ?? layout?.height ?? 0;

    // ── Blur radius distribution ──────────────────────────────────
    // For static blur values, we can still extract common blur.
    // When animated, each shape handles its own blur entirely.
    const resolvedBlurs = useMemo(() => {
        const radii = shapeItems.map((it) => {
            const br = it.blurRadius ?? defaultBlurRadius;
            // Only optimize static values
            return typeof br === 'number' ? br : defaultBlurRadius;
        });
        const minBlur = Math.min(...radii);
        return {
            perShape: radii.map((r) => r - minBlur),
            shared: minBlur,
        };
    }, [shapeItems, defaultBlurRadius]);

    // ── Scaling math ──────────────────────────────────────────────
    const {scale, offsetX, offsetY} = useMemo(() => {
        if (srcSize.width === 0) return {scale: 1, offsetX: 0, offsetY: 0};
        const s = width / srcSize.width;
        const diffW = width - srcSize.width;
        const diffH = height - srcSize.height;
        return {scale: s, offsetX: diffW / 2, offsetY: diffH / 2};
    }, [width, height, srcSize]);

    const hasSize = width > 0 && height > 0;

    return (
        <View
            style={[styles.container, {width: _width, height: _height}, style]}
            onLayout={onLayout}
        >
            {hasSize && (
                <Canvas style={StyleSheet.absoluteFill}>
                    <Group
                        transform={[
                            {scale},
                            {translateX: offsetX},
                            {translateY: offsetY},
                        ]}
                        origin={{x: srcSize.width / 2, y: srcSize.height / 2}}
                    >
                        <Group
                            transform={[
                                {translateX: initialOffset.x},
                                {translateY: initialOffset.y},
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
export {BlurMesh};
