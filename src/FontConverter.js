'use strict';

const fs = require('fs');
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const ttf2eot = require('ttf2eot');

module.exports = class FontConverter {
  convert(file, extension) {
    var converter = [];
    converter['.woff2'] = ttf2woff2;
    converter['.woff'] = ttf2woff;
    converter['.eot'] = ttf2eot;

    return new Promise((resolve, reject) => {
      fs.readFile('tmp/' + file + '.ttf', (error, data) => {
        if (error)
          reject(error);
        else {
          var ttf = new Uint8Array(data);
          var convertedFont = new Buffer(converter[extension](ttf).buffer);
          fs.writeFile('tmp/' + file + extension, convertedFont, (error) => {
            if (error)
              reject(new Error(error));
            resolve(file + extension);
          });
        }
      });
    });
  }
};
