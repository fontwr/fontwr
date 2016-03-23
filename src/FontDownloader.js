'use strict';

const q = require('q');
const wget = require('wget');
const https = require('follow-redirects').https;

module.exports = class FontDownloader{
  constructor(fontName){
    this.fontName = fontName.toLowerCase();
    this.fontsOptions = [];
    this.baseRawPath = 'https://raw.githubusercontent.com/google/fonts/master/apache/';
    this.baseAPIPath = 'https://api.github.com/repos/google/fonts/contents/apache/';
    this.output = 'tmp/';
  }

  verify(){
    var deferred = q.defer();
    var options = {
      host: 'api.github.com',
      path: '/repos/google/fonts/contents/apache/' + this.fontName,
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'fontwer'
      },
      method: 'GET'
    };

    https.request(options, (res) => {
      var body = [];
      if (res.statusCode === 200){
        res.on('data', function(chunk) {
          body += chunk;
        });        

        res.on('end', () => {
          deferred.resolve(JSON.parse(body));
        });          
      }
      else if (res.statusCode === 404)
        deferred.reject(new Error('Font not found. Try running the command: fontwr -list'));
      else
        deferred.reject(new Error('HTTP Status Code: ' + res.statusCode));
    }).on('error', (e) => {
      deferred.reject(new Error(e));
    })
    .end();

    return deferred.promise;
  }

  filter(fonts){
    var filteredFonts = [];
    fonts.forEach(function(font){
      if (font.name.match(/.ttf$/i))
        filteredFonts.push(font.name.replace(/.ttf$/i, ''));
    });
    return filteredFonts;
  }

  download(fileName){
    console.log(fileName);
    var deferred = q.defer();
    wget.download(this.baseRawPath + this.fontName + '/' + fileName + '.ttf', this.output + fileName + '.ttf')
      .on('error', function(err){
        deferred.reject(new Error(err));
      })
      .on('end', function(){
        deferred.resolve(fileName);
      });
    return deferred.promise;
  }
};