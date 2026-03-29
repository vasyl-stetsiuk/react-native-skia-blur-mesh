import type {ReactNode} from 'react';
import type {ViewStyle, StyleProp} from 'react-native';

/**
 * A value that can be either static or a Reanimated SharedValue.
 * When static, no reanimated dependency is needed.
 */
export type Animatable<T> = T | { value: T };

/**
 * Supported shape types for blurred mesh items.
 */
export type BlurredShapeType =
    | { kind: 'oval' }
    | { kind: 'roundedRect'; rx: Animatable<number>; ry?: Animatable<number> }
    | { kind: 'rect' };

/**
 * Single blurred shape item in the mesh.
 *
 * All numeric values and color accept `Animatable<T>` —
 * either a static value or a Reanimated `SharedValue<T>`
 * for 60fps UI-thread animations.
 *
 * Coordinate system matches Figma:
 *   - sizes and offsets are in "design points" relative to `srcSize`
 *   - rotation in degrees (sign is inverted vs Figma)
 *
 * @example Static
 * ```ts
 * {
 *   color: 'rgba(176, 178, 255, 0.6)',
 *   size: { width: 595, height: 265 },
 *   rotate: 0,
 *   topLeft: { x: -85, y: -113 },
 * }
 * ```
 *
 * @example Animated
 * ```ts
 * const x = useSharedValue(-85);
 * const color = useSharedValue('rgba(176, 178, 255, 0.6)');
 *
 * {
 *   color,
 *   size: { width: 595, height: 265 },
 *   rotate: 0,
 *   topLeft: { x, y: -113 },
 * }
 * ```
 */
export interface ShapeItem {
    /** Fill color — any CSS-style string or SharedValue<string> */
    color: Animatable<string>;
    /** Size of the shape in design points */
    size: {
        width: Animatable<number>;
        height: Animatable<number>;
    };
    /** Rotation in degrees (Figma sign inverted: Figma -75° → here 75°) */
    rotate: Animatable<number>;
    /** Top-left offset in design points (take from Figma at 0° rotation) */
    topLeft: {
        x: Animatable<number>;
        y: Animatable<number>;
    };
    /** Shape type. Default: oval */
    shape?: BlurredShapeType;
    /** Per-item blur radius override */
    blurRadius?: Animatable<number>;
}

/**
 * Props for the `<BlurMesh>` component.
 */
export interface BlurMeshProps {
    /** Array of blurred shape descriptors */
    shapeItems: ShapeItem[];
    /**
     * Reference "source" size from Figma.
     * Shapes are authored relative to this size and proportionally
     * scaled to fit the actual component dimensions.
     */
    srcSize: { width: number; height: number };
    /** Default blur radius applied to shapes without their own. Default: 185 */
    defaultBlurRadius?: number;
    /** Optional initial translation offset applied to all shapes */
    initialOffset?: { x: number; y: number };
    /** Explicit component width. If omitted, measured via onLayout. */
    width?: number;
    /** Explicit component height. If omitted, measured via onLayout. */
    height?: number;
    /** RN style for the outer container */
    style?: StyleProp<ViewStyle>;
    /** Content rendered on top of the blurred background */
    children?: ReactNode;
}
