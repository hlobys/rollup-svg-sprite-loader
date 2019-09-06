const path = require('path');
const { readFileSync }  = require('fs');
const SVGCompiler = require('svg-baker');
const nanoid = require('nanoid');

const spriteFactory = require('svg-baker/lib/sprite-factory');
const Sprite = require('svg-baker/lib/sprite');

const extension = '.svg'

let svgCompiler = new SVGCompiler();

module.exports = function svgSpriteLoader (options = {}) {
  return {
    name: 'rollup-svg-sprite-loader',
    async load (id) {
      if (path.extname(id) !== extension)
        return null

      const data = readFileSync( id, 'UTF-8' );
      const useId = nanoid();
      const symbol = await svgCompiler.addSymbol({ id: useId, content: data, path: id })
      // eslint-disable-next-line max-len
      const code = `const img = {id: ${JSON.stringify(useId)}, content: ${JSON.stringify(data)}, viewbox: ${JSON.stringify(symbol.viewBox || '')} }; export default img;`

      const ast = {
        type: 'Program',
        sourceType: 'module',
        start: 0,
        end: null,
        body: []
      };

      return { ast, code, map: { mappings: '' } };

    },
    async renderChunk (code, chunk, options) {
      const sprite = await Sprite.create({
        symbols: svgCompiler.symbols,
        factory: spriteFactory
      })
      const content = sprite.render()
      // eslint-disable-next-line max-len
      const svgNodeInsert = 'if (window) { window.document.addEventListener(\'DOMContentLoaded\', function(){ window.document.body.prepend('+ JSON.stringify(content) + ') }); }'
      const replacedCode = code + svgNodeInsert

      return { code: replacedCode }
    }


  };
}
