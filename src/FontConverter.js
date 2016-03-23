'use strict';

const q = require('q');
const fs = require('fs');
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const ttf2eot = require('ttf2eot');

module.exports = class FontConverter{
  convert(file, extension){
    var converter = [];
    converter['.woff'] = ttf2woff;
    converter['.woff2'] = ttf2woff2;
    converter['.eot'] = ttf2eot;

    var deferred = q.defer();
    fs.readFile('tmp/' + file + '.ttf', function(err, data){
      if (err)
        deferred.reject(new Error(err));

      var ttf = new Uint8Array(data);
      var convertedFont = new Buffer(converter[extension](ttf).buffer);
      fs.writeFile('tmp/' + file + extension, convertedFont, function(err){
        if (err)
          deferred.reject(new Error(err));
        deferred.resolve();
      });
    });
    return deferred.promise;    
  }
};