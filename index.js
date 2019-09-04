const path = require('path');
const { readFileSync }  = require('fs');
const SVGCompiler = require('svg-baker');

const spriteFactory = require('svg-baker/lib/sprite-factory');
const Sprite = require('svg-baker/lib/sprite');

const extension = '.svg'

let svgCompiler = new SVGCompiler();

module.exports = function svgSpriteLoader (options = {}) {
  const mappedList  = {}
  const sourceDir = options.sourceDir || 'src'
  return {
    name: 'rollup-svg-sprite-loader',
   resolveId (source, importer) {
      const module = extension === path.extname(source)
      if (module) {
        const filePath = path.resolve(path.resolve(), path.dirname(importer),source)
        const content = readFileSync(filePath, 'UTF-8')

        svgCompiler.addSymbol({ id: filePath, content: content, path: filePath })
          .then(symbol => {
          }).catch(e => console.log('error', e));

        mappedList[filePath] = {
          path: filePath,
          id: filePath,
          content: content
        }
        return false
      }
      return  null
    },
    async renderChunk (code, chunk, options) {
      const { symbols } = svgCompiler
      const importRegex = new RegExp(/import(?:["'\s]*([\w*{}$\n\r\t, ]+)from\s*)?(["'\s].*(.svg)["'\s]).*/, 'g')

      let replacedCode = code.replace(importRegex, function ($0, $1, $2, $3) {
        let relativeFilePath = $2.replace(/'/g, '')
        const dirPath = path.resolve()
        const absoluteFilePath = path.resolve(dirPath, sourceDir,  relativeFilePath)
        const symbol = symbols.find(s => s.id === absoluteFilePath)
        const viewBox = symbol ? symbol.viewBox : ''
        const item = { ... mappedList[absoluteFilePath], viewBox }

        return 'const ' + $1 + ' = ' + JSON.stringify(item);

      })

      const sprite = await Sprite.create({
        symbols: svgCompiler.symbols,
        factory: spriteFactory
      })
      const content = sprite.render()
      const svgNodeInsert = 'if (window) { window.document.addEventListener(\'DOMContentLoaded\', function(){ window.document.body.prepend('+ JSON.stringify(content) + ') }); }'
      replacedCode = replacedCode + svgNodeInsert

      return { code: replacedCode }
    }


  };
}
