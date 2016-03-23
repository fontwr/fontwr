'use strict';

const q = require('q');
const inquirer = require('inquirer');
const fs = require('fs');
const rimraf = require('rimraf');
const FontDownloader = require('./FontDownloader.js');
const FontConverter = require('./FontConverter');
const FontFaceCreator = require('./FontFaceCreator');

// console.log(FontDownloader);

var fr = new FontDownloader('RobotoSlab');
var fc = new FontConverter();
var ffc = new FontFaceCreator();
// ffc.createFontFaceFile('Test-Light', ['.woff', '.ttf']);

try{
  fs.mkdirSync('tmp');
}catch(err){
  if(err.code === 'EEXIST')
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

          // cli.copy

          // fs.rename('tmp/RobotoSlab-Bold.ttf', 'fonts/asd.ttf');
          // fs.createReadStream('tmp/*')
            // .pipe(fs.createWriteStream('fonts/RobotoSlab-Bold.ttf'));
        });        
      });
    });
  });

}, function(err){
  console.log(err.message);
});

