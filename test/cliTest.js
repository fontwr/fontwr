"use strict"
var chai = require('chai');
var sinon = require('sinon');
var fontwr = require('../src/cli.js');
var onlyttf = require('./fixture/FontFaceCreator/onlyttf.js');
var onlyttfandwoff = require('./fixture/FontFaceCreator/ttfandwoff.js');
var FontFaceCreator = require('../src/FontFaceCreator.js');
var assert = chai.assert;

// it("returns the return value from the original function", function () {
//     var myAPI = { method: function () {} };

//     var mock = sinon.mock(myAPI);
//     mock.expects("method").once();
//     myAPI.method();

//     mock.verify();
// });

describe('FontFaceCreator features', function(){
  it('should convert only a ttf', function(){
    var fontFaceCreator = new FontFaceCreator();
    fontFaceCreator.createFontFace('Roboto', ['.ttf']);
    assert.equal(fontFaceCreator.output, onlyttf);
  });
  it('should convert ttf and woff', function(){
    var fontFaceCreator = new FontFaceCreator();
    fontFaceCreator.createFontFace('Roboto', ['.ttf', '.woff']);
    console.log(fontFaceCreator.output);
    assert.equal(fontFaceCreator.output, onlyttfandwoff);
  });
})