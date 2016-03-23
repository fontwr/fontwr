'use strict';

const q = require('q');
const wget = require('wget');
const https = require('follow-redirects').https;
const inquirer = require('inquirer');
const _ = require('underscore');
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const ttf2eot = require('ttf2eot');
const fs = require('fs');
const rimraf = require('rimraf');
const indentString = require('indent-string');

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
}

class FontConverter{
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
}

class FontFaceCreator{
  constructor(){
    this.output = '';
  }

  generateSources(fontName, extensions){
    var hasTTF = false;
    var sources = '';

    if (_.contains(extensions, '.eot')){
      var eotIndex = extensions.indexOf('.eot');
      extensions.splice(eotIndex, 1);
      sources += `src: url('fonts/${fontName}.eot');\n` + 
        `src: url('fonts/${fontName}.eot?#iefix') format('embedded-opentype');\n`;
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

      extensions.forEach(function(extension, i){
        sources += indentString(`url('fonts/${fontName}${extension}') format('${extension.replace('.', '')}')` + 
          `${(i === extensions.length - 1 && !hasTTF) ? `;` : `,`}` +
          `\n`, ' ', 4);
      });

      if (hasTTF)
          sources += indentString(`url('fonts/${fontName}.ttf') format('truetype');\n`, ' ', 4);
    }
    return sources;
  }

  createFontFaceFile(fontName, extensions){
    this.output += `@font-face {\n` + 
      indentString(`font-family: '${fontName}';\n` +
        this.generateSources(fontName, extensions) + 
        `font-weight: normal;\n` +
        `font-style: normal;\n`, ' ', 2) +
      `}\n`;
    // console.log(this.output);
  }
}

module.exports.FontDownloader = FontDownloader;

var fr = new FontDownloader('RobotoSlab');
var fc = new FontConverter();
var ffc = new FontFaceCreator();
// ffc.createFontFaceFile('Test-Light', ['.woff', '.ttf']);

try{
  fs.mkdirSync('tmp');
}catch(err){
  if(err.code == 'EEXIST')
    rimraf.sync('tmp/*');
  else 
    throw err;
}

fr.verify().then(function(data){
  inquirer.prompt([{
    type: 'checkbox',
    pageSize: 10,
    message: 'Choose the Font Family:',
    name: 'fontFamilies',
    choices: fr.filter(data) //refactor

  }], function(answers){
    var downloadQueue = [];
    answers.fontFamilies.forEach(function(fontFamily){
      downloadQueue.push(fr.download(fontFamily));
    });

    q.allSettled(downloadQueue).then(function(filesNames){
      inquirer.prompt([{
        type: 'checkbox',
        pageSize: 10,
        message: 'Select which formats you want inside the font-face:',
        name: 'fontFormats',
        choices: [{name: '.woff2'}, {name: '.woff'}, 
          {name: '.eot'}, {name: '.ttf'}]
      }], function(answers){      
        var conversionQueue = [];
        answers.fontFormats.forEach(function(fontFormat){
          if (fontFormat === '.ttf')
            return;

          filesNames.forEach(function(fileName){
            conversionQueue.push(fc.convert(fileName.value, fontFormat));
          });
        });

        q.allSettled(conversionQueue).then(function(){
          filesNames.forEach(function(fileName){
            ffc.createFontFaceFile(fileName.value, answers.fontFormats.slice());
          });
          fs.writeFileSync('fonts.css', ffc.output);
        });        
      });
    });
  });

}, function(err){
  console.log(err.message);
});

