# react-native-skia-blur-mesh

Blurred color mesh backgrounds for React Native — soft gradient effects with colored shapes and Gaussian blur.

Powered by [`@shopify/react-native-skia`](https://shopify.github.io/react-native-skia/).

## Features

- **Soft gradients** — overlapping blurred shapes create organic mesh-gradient effects
- **Figma workflow** — define shapes in Figma coordinates, they scale automatically
- **No blur limit** — uses Skia ImageFilter, no 128 sigma cap
- **Per-shape controls** — individual color, size, rotation, position, blur radius
- **Cross-platform** — iOS & Android

## Installation

```bash
npm install react-native-skia-blur-mesh @shopify/react-native-skia
```

> **Peer dependency**: `@shopify/react-native-skia` >= 1.0.0

## Usage

```tsx
import { BlurMesh } from 'react-native-skia-blur-mesh';

<BlurMesh
  width={343}
  height={146}
  srcSize={{ width: 343, height: 146 }}
  defaultBlurRadius={185}
  shapeItems={[
    {
      color: 'rgba(176, 178, 255, 0.6)',
      size: { width: 595, height: 265 },
      rotate: 0,
      topLeft: { x: -85, y: -113 },
    },
    {
      color: '#DE67D2',
      size: { width: 380, height: 200 },
      rotate: 0,
      topLeft: { x: 36, y: 139 },
    },
    {
      color: '#FFF3C9',
      size: { width: 380, height: 200 },
      rotate: 75, // -75° in Figma → 75° here
      topLeft: { x: -219.23, y: 22.41 },
    },
  ]}
>
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Content on top</Text>
  </View>
</BlurMesh>
```

### Auto-sizing (no explicit width/height)

```tsx
<BlurMesh
  style={{ flex: 1 }}
  srcSize={{ width: 343, height: 146 }}
  shapeItems={shapeItems}
>
  {children}
</BlurMesh>
```

The component measures itself via `onLayout` when `width`/`height` are omitted.

## Figma Workflow

Same rules as the Compose version:

1. **Rotation is inverted**: Figma shows -75° → use `75` in code
2. **Take offsets at 0° rotation**: Read `topLeft` from Figma with rotation reset to 0
3. **Shapes are drawn in reversed order**: Bottom layer first — handled automatically

## API

### `<BlurMesh>` Props

| Prop               | Type                | Default     | Description                                 |
| ------------------ | ------------------- | ----------- | ------------------------------------------- |
| `shapeItems`       | `ShapeItem[]`       | required    | Array of blurred shape descriptors          |
| `srcSize`          | `{ width, height }` | required    | Figma reference size for proportional scale |
| `defaultBlurRadius`| `number`            | `185`       | Default blur radius                         |
| `initialOffset`    | `{ x, y }`         | `{ 0, 0 }`  | Global offset for all shapes                |
| `width`            | `number`            | auto        | Component width                             |
| `height`           | `number`            | auto        | Component height                            |
| `style`            | `ViewStyle`         | —           | Style for the outer container               |
| `children`         | `ReactNode`         | —           | Content rendered above the blurred bg       |

### `ShapeItem`

| Prop         | Type               | Default | Description                              |
| ------------ | ------------------ | ------- | ---------------------------------------- |
| `color`      | `string`           | required | Fill color (CSS color string)           |
| `size`       | `{ width, height }` | required | Shape size in design points            |
| `rotate`     | `number`           | required | Rotation in degrees (Figma sign inverted) |
| `topLeft`    | `{ x, y }`        | required | Position in design points               |
| `shape`      | `BlurredShapeType` | `oval`  | Shape type                               |
| `blurRadius` | `number`           | inherits | Per-item blur radius override           |

### `BlurredShapeType`

| Kind          | Props      | Description        |
| ------------- | ---------- | ------------------ |
| `oval`        | —          | Ellipse (default)  |
| `roundedRect` | `rx`, `ry?` | Rounded rectangle |
| `rect`        | —          | Rectangle          |

## How it works

The component renders a Skia `<Canvas>` behind your children. Each shape item is drawn as a colored ellipse/rect with a Gaussian blur (ImageFilter) applied. The shapes are positioned in a Figma-relative coordinate system and automatically scaled to fit the component's actual dimensions.

This is a React Native port of a Jetpack Compose component for creating blurred background effects.

## License

MIT © [Vasyl Stetsiuk](https://stetsiuk.dev)
