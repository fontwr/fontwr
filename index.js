'use strict';

var q = require('q');
var wget = require('wget');
var https = require('follow-redirects').https;
var inquirer = require('inquirer');
var _ = require('underscore');
var ttf2woff = require('ttf2woff');
var ttf2woff2 = require('ttf2woff2');
var ttf2eot = require('ttf2eot');
var fs = require('fs');

class FontDownloader{
  constructor(fontName){
    this.fontName = fontName.toLowerCase();
    this.fontsOptions = [];
    this.baseRawPath = 'https://raw.githubusercontent.com/google/fonts/master/apache/'
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
      // res.statusCode
      // console.log(res);
      // var body = '';
      // console.log('statusCode: ', res.statusCode);
      // console.log('body: ', res);
      // res.setEncoding('utf8');


    })
    .on('error', (e) => {
      deferred.reject(new Error(e));
    })
    .end();

    return deferred.promise;
  }

  filter(fonts){
    var filteredFonts = [];
    fonts.forEach(function(font){
      if (font.name.match(/.ttf$/i))
        filteredFonts.push(font);
    });
    return filteredFonts;
  }

  download(fileName){
    var deferred = q.defer();
    wget.download(this.baseRawPath + this.fontName + '/' + fileName, this.output + fileName)
      .on('error', function(err){
        deferred.reject(new Error(err));
      })
      .on('end', function(){
        deferred.resolve(fileName);
      });
    return deferred.promise;
  }
}

class FontConverter{
  convert(file, extension){
    var converter = []
    converter['.woff'] = ttf2woff;
    converter['.woff2'] = ttf2woff2;
    converter['.eot'] = ttf2eot;

    var deferred = q.defer();
    fs.readFile('tmp/' + file, function(err, data){
      if (err)
        deferred.reject(new Error(err));

      var ttf = new Uint8Array(data);
      var convertedFont = new Buffer(converter[extension](ttf).buffer);
      fs.writeFile('tmp/' + file.replace(/.ttf$/i, extension), convertedFont, function(err){
        if (err)
          deferred.reject(new Error(err));
        deferred.resolve();
      });
    });
    return deferred.promise;    
  }

  // convert(fontFamily, extension){
  //   base(fontFamily, extension)
  // }

  // toWoff(file){
  //   base(file, '.woff');
  // }

  // toWoff2(file){
  //   base(file, '.woff2');
  // }

  // toEot(file){
  //   base(file, '.eot');
  // }
}

// class FontFaceCreator{

// }

module.exports.FontDownloader = FontDownloader;

var fr = new FontDownloader('RobotoSlab');
var fc = new FontConverter();

fr.verify().then(function(data){
  inquirer.prompt([{
    type: 'checkbox',
    pageSize: 10,
    message: 'Choose the Font Family:',
    name: 'fontFamilies',
    choices: fr.filter(data)

  }], function(answers){
    var downloadQueue = [];
    answers.fontFamilies.forEach(function(fontFamily){
      downloadQueue.push(fr.download(fontFamily));
    });

    q.allSettled(downloadQueue).then(function(filesNames){
      inquirer.prompt([{
        type: 'checkbox',
        pageSize: 10,
        message: 'Select which format you want inside the font-face:',
        name: 'fontFormats',
        choices: [{name: '.woff'}, {name: '.woff2'}, {name: '.eot'}]
      }], function(answers){      
        answers.fontFormats.forEach(function(fontFormat){
          filesNames.forEach(function(fileName){
            fc.convert(fileName.value, fontFormat);
          })
        });      
      });
    });


  });

}, function(err){
  console.log(err.message);
});

