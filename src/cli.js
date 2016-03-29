#!/usr/bin/env node
'use strict';

const q = require('q');
const inquirer = require('inquirer');
const fs = require('fs');
const rimraf = require('rimraf');
const https = require('follow-redirects').https;
const FontRepository = require('./FontRepository');
const FontConverter = require('./FontConverter');
const FontFaceCreator = require('./FontFaceCreator');

class CLI{
  static cleanTmpDirectory(){
    try{
      fs.mkdirSync('tmp');
    }catch(error){
      if(error.code === 'EEXIST')
        rimraf.sync('tmp/*');
      else
        throw error;
    }
  }

  static filter(fonts){
    var filteredFonts = [];
    fonts.forEach(function(font){
      if (font.name.match(/.ttf$/i))
        filteredFonts.push(font.name.replace(/.ttf$/i, ''));
    });
    return filteredFonts;
  }

  static listAllFonts(){
    const fontRepository = new FontRepository(this.fontFamily);
    fontRepository.list().then(function(list){
      // var newList = [];
      list.forEach(function(element){
        console.log('- ' + element);
      })
      // console.log(newList);
    }, function(error){
      console.log(error.message);
    });
  }

  static chooseFonts(){
    const fontRepository = new FontRepository();
    fontRepository.setFontName(this.fontFamily);

    fontRepository.verify().then((data) => {
      inquirer.prompt([{
        type: 'checkbox',
        pageSize: 10,
        message: 'Choose the Font Family:',
        name: 'fontFamilies',
        choices: CLI.filter(data)

      }], (answers) => {
        CLI.downloadQueue = [];
        answers.fontFamilies.forEach((fontFamily) => {
          this.downloadQueue.push(fontRepository.download(fontFamily));
        });
        this.downloadFonts();
      })}, (error) => {
        console.log(error.message);
      });
  }

  static downloadFonts(){
    if (this.global)
      console.log('is global');
    else{
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
      }, (error) => {
        console.log(error.message)
      });
    }
  }

  static convertFonts(answers, filesNames){
    const fontConverter = new FontConverter();

    this.conversionQueue = [];
    answers.fontFormats.forEach((fontFormat) => {
      if (fontFormat === '.ttf')
        return;

      filesNames.forEach((fileName) => {
        this.conversionQueue.push(fontConverter.convert(fileName.value, fontFormat));
      });
    });

    q.allSettled(this.conversionQueue).then(() => {
      this.createFontFaceFile(answers.fontFormats, filesNames);
    });
  }

  static createFontFaceFile(answers, filesNames){
    const fontFaceCreator = new FontFaceCreator();
    filesNames.forEach((fileName) => {
      fontFaceCreator.createFontFace(fileName.value, answers.slice());
    });
    fs.writeFileSync('fonts.css', fontFaceCreator.output);
  }

  static execute(){
    var yargs = require('yargs')
      .usage('fontwr <command> [options]')
      .demand(1)
      .help('h')
      .strict()
      .command('list', 'List all availables fonts')
      .command('get', 'List all availables fonts')
      .example('fontwr get opensans', 'Get Open Sans font')
      .example('fontwr roboto -g', 'Get Roboto and install into system\'s font directory')
      .describe('h', 'Show this help')
      .describe('g', 'Download font to the system\'s font directory')
      .alias('h', 'help');

    var command = yargs.argv._[0]

    if (command === 'list')
      this.listAllFonts();
    else if (command === 'get'){
      yargs.reset()
      .demand(2)
      .example('fontwr get opensans', 'Get Open Sans font')
      .example('fontwr get roboto -g', 'Get Roboto and install into system\'s font directory')
      .argv;

      this.fontFamily = yargs.argv._[1].toString();
      this.global = yargs.argv.g;

      this.cleanTmpDirectory();
      this.chooseFonts();
    }
  }
}

CLI.execute();