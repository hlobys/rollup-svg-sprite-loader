# rollup-svg-sprite-loader

Import SVG files into sprite

## Installation

```bash
npm install --save-dev rollup-svg-sprite-loader
```

## Usage

```js
// rollup.config.js
import svgSpriteLoader from 'rollup-svg-sprite-loader';

export default {
  entry: 'src/index.js',
  dest: 'dist/my-lib.js',
  plugins: [
    svgSpriteLoader()
  ]
};
```
