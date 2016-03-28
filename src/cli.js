'use strict';

const q = require('q');
const inquirer = require('inquirer');
const fs = require('fs');
const rimraf = require('rimraf');
const FontDownloader = require('./FontDownloader');
const FontConverter = require('./FontConverter');
const FontFaceCreator = require('./FontFaceCreator');

class CLI{
  static cleanTmpDirectory(){
    try{
      fs.mkdirSync('tmp');
    }catch(err){
      if(err.code === 'EEXIST')
        rimraf.sync('tmp/*');
      else 
        throw err;
    }    
  }

  static chooseFonts(){
    const fr = new FontDownloader('RobotoSlab');

    //change fr to fd OR fontDownloader<<
    fr.verify().then((data) => {
      inquirer.prompt([{
        type: 'checkbox',
        pageSize: 10,
        message: 'Choose the Font Family:',
        name: 'fontFamilies',
        choices: fr.filter(data) //refactor

      }], (answers) => {
        CLI.downloadQueue = [];
        answers.fontFamilies.forEach((fontFamily) => {
          console.log(this.downloadQueue)
          this.downloadQueue.push(fr.download(fontFamily));
        });
        this.downloadFonts();
      })}, function(err){
        console.log(err.message);
      });   
  }

  static downloadFonts(){
    // if (!global)
      q.allSettled(this.downloadQueue).then((filesNames) => {
        inquirer.prompt([{
          type: 'checkbox',
          pageSize: 10,
          message: 'Select which formats you want inside the font-face:',
          name: 'fontFormats',
          choices: [{name: '.woff2'}, {name: '.woff'}, 
            {name: '.eot'}, {name: '.ttf'}]
        }], (answers) => {
          this.convertFonts(answers, filesNames);
        });
      }, function(err){
        console.log(err.message)
      });
  }

  static convertFonts(answers, filesNames){
    const fc = new FontConverter();

    this.conversionQueue = [];
    answers.fontFormats.forEach((fontFormat) => {
      if (fontFormat === '.ttf')
        return;

      filesNames.forEach((fileName) => {
        this.conversionQueue.push(fc.convert(fileName.value, fontFormat));
      });
    });

    q.allSettled(this.conversionQueue).then(() => {
      this.createFontFaceFile(answers.fontFormats, filesNames);
    });
  }

  static createFontFaceFile(answers, filesNames){
    const ffc = new FontFaceCreator();
    filesNames.forEach(function(fileName){
      ffc.createFontFace(fileName.value, answers.slice());
    });
    fs.writeFileSync('fonts.css', ffc.output);
  }

  static execute(){
    this.cleanTmpDirectory();
    this.chooseFonts();
  }
}

CLI.execute();


