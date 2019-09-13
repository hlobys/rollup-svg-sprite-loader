const path = require('path');
const { readFileSync }  = require('fs');
const SVGCompiler = require('svg-baker');
const nanoid = require('nanoid');

const spriteFactory = require('svg-baker/lib/sprite-factory');
const Sprite = require('svg-baker/lib/sprite');

const extension = '.svg'

let svgCompiler = new SVGCompiler();
const svgReplaceObjects = [];

module.exports = function svgSpriteLoader (options = {}) {
  return {
    name: 'rollup-svg-sprite-loader',
    async load (id) {
      if (path.extname(id) !== extension)
        return null;

      const data = readFileSync( id, 'UTF-8' );

      let svgReplace = svgReplaceObjects.find(svg => svg.content === data);
      if (!svgReplace) {
        const useId = nanoid();
        const symbol = await svgCompiler.addSymbol({ id: useId, content: data, path: id });
        svgReplace = {
            id: JSON.stringify(useId),
            content: data,
            viewBox: symbol.viewBox,
        };
          svgReplaceObjects.push(svgReplace)
      }

      // eslint-disable-next-line max-len
      return`var img = {id: ${svgReplace.id}, content: ${JSON.stringify(svgReplace.content)}, viewbox: ${JSON.stringify(svgReplace.viewBox)} }; export default img;`;

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
      });
      const content = sprite.render();
      // eslint-disable-next-line max-len
      const svgNodeInsert = 'if (window) { window.document.addEventListener(\'DOMContentLoaded\', function(){ const div = document.createElement(\'div\'); div.setAttribute(\'style\', \'display: none; height:0; width: 0; overflow: hidden;\');  div.innerHTML = '+ JSON.stringify(content) + ';  window.document.body.appendChild(div) }); }'
      const replacedCode = code + svgNodeInsert;

      return { code: replacedCode }
    }


  };
}
