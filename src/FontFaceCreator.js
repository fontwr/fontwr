'use strict';

const _ = require('underscore');
const indentString = require('indent-string');

module.exports = class FontFaceCreator{
  constructor(){
    this.output = '';
  }

  generateSources(fontName, extensions){
    var hasTTF = false;
    var sources = '';

    if (_.contains(extensions, '.eot')){
      var eotIndex = extensions.indexOf('.eot');
      extensions.splice(eotIndex, 1);
      sources += `src: url('../fonts/${fontName}.eot');\n` +
        `src: url('../fonts/${fontName}.eot?#iefix') format('embedded-opentype');\n`;
    }

    if (extensions.length === 0)
      sources += `src: local('${fontName}');\n`;
    else{
      sources += `src: local('${fontName}'),\n`;

      if (_.contains(extensions, '.ttf')){
        hasTTF = true;
        let ttfIndex = extensions.indexOf('.ttf');
        extensions.splice(ttfIndex, 1);
      }

      extensions.forEach((extension, i) => {
        sources += indentString(`url('../fonts/${fontName}${extension}') format('${extension.replace('.', '')}')` +
          `${(i === extensions.length - 1 && !hasTTF) ? `;` : `,`}` +
          `\n`, ' ', 2);
      });

      if (hasTTF)
          sources += indentString(`url('../fonts/${fontName}.ttf') format('truetype');\n`, ' ', 2);
    }
    return sources;
  }

  createFontFace(fontName, extensions){
    this.output += `@font-face {\n` +
      indentString(`font-family: '${fontName}';\n` +
        this.generateSources(fontName, extensions) +
        `font-weight: normal;\n` +
        `font-style: normal;\n`, ' ', 2) +
      `}\n`;
  }
};