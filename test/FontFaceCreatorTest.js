'use strict';
var chai = require('chai'),
  FontFaceCreator = require('../src/FontFaceCreator.js'),
  assert = chai.assert,
  q = require('q'),
  fs = require('fs');

function loadFixture(path){
  var deferred = q.defer();
  fs.readFile(path, 'utf8', (error, data) => {
    if (error) deferred.reject(new Error(error));
    deferred.resolve(data);
  });
  return deferred.promise;
}

describe('FontFaceCreator features', () => {
  it('should convert only a ttf', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/ttf.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.ttf']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
  it('should convert woff and ttf', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/woffttf.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.ttf', '.woff']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
  it('should convert woff2, woff and ttf', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/woff2woffttf.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.ttf', '.woff2', '.woff']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
  it('should convert eot, woff2, woff, ttf', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/eotwoff2woffttf.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.ttf', '.eot', '.woff2', '.woff']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
  it('should convert eot, ttf', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/eotttf.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.eot', '.ttf']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
  it('should convert woff2, woff', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/woff2woff.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.woff2', '.woff']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
  it('should convert woff2, woff, eot', () => {
    var fontFaceCreator = new FontFaceCreator();
    return loadFixture('test/fixture/FontFaceCreator/woff2woffeot.css').then((fontFace) => {
      fontFaceCreator.createFontFace('Roboto', ['.woff2', '.woff', '.eot']);
      assert.equal(fontFaceCreator.output, fontFace);
    }, (error) => {
      console.log(error);
    });
  });
});