#!/usr/bin/env node
'use strict';

const q = require('q'),
  inquirer = require('inquirer'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  FontRepository = require('./FontRepository'),
  FontConverter = require('./FontConverter'),
  FontFaceCreator = require('./FontFaceCreator'),
  cpr = require('cpr'),
  regedit = require('regedit'),
  pkg = require('../package.json'),
  checkUpdate = require('check-update'),
  colors = require('colors'),
  spinner = require('cli-spinner').Spinner;

class CLI{
  static createOrUseDirectory(directory, callback){
    try{
      fs.mkdirSync(directory);
    }catch(error){
      if (error.code === 'EEXIST'){
        if (callback)
          callback();
      }else
        throw error;
    }
  }

  static cleanDirectory(directory){
    this.createOrUseDirectory(directory, () => {
      rimraf.sync(directory + '/*');
    });
  }

  static filter(fonts){
    var filteredFonts = [];
    fonts.forEach((font) =>{
      if (font.name.match(/.ttf$/i))
        filteredFonts.push(font.name.replace(/.ttf$/i, ''));
    });
    return filteredFonts;
  }

  static listAllFonts(){
    const fontRepository = new FontRepository(this.fontFamily);
    fontRepository.list().then((list) => {
      list.forEach((element) => {
        console.log('- ' + element);
      });
    }, (error) => {
      console.log(error.message.error);
    });
  }

  static registerFonts(filesNames){
    filesNames.forEach((fileName) => {
      var registryName = fileName.value + ' (TrueType)';
      regedit.putValue({
        'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts': {
            [registryName]: {
                value: fileName.value + '.ttf',
                type: 'REG_SZ'
            }
       }
      }, (error) => {
        if (error)
          console.log(error);
      });
    });
  }

  static copyToSystemFontDirectory(filesNames){
    var fontsDirectory = [];
    fontsDirectory.win32 = '\\Windows\\Fonts';
    fontsDirectory.darwin = '/Library/Fonts';
    fontsDirectory.linux = '/usr/share/fonts';

    cpr('tmp', fontsDirectory[process.platform],{
      deleteFirst: false,
      overwrite: false,
      confirm: true
    }, (error) => {
      if (error)
        console.log(error);
      else if (process.platform === 'win32')
        this.registerFonts(filesNames);

      console.log('√ Fonts copied to system\'s fonts directory.'.green);
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
      }, (error) => {
        console.log(error.message);
      });
    }, (error) =>{
      console.log(error.message)
    });
  }

  static downloadFonts(){
    var downloadSpinner = new spinner('Downloading.. %s');
    downloadSpinner.setSpinnerString('|/-\\');
    downloadSpinner.start();

    q.allSettled(this.downloadQueue).then((filesNames) => {
      downloadSpinner.stop(true);
      if (this.global){
        this.copyToSystemFontDirectory(filesNames);
      }else{
        inquirer.prompt([{
          type: 'checkbox',
          pageSize: 10,
          message: 'Select which formats you want inside the font-face:',
          name: 'fontExtensions',
          choices: [{name: '.woff2'}, {name: '.woff'},
            {name: '.eot'}, {name: '.ttf'}]
        }], (answers) => {
          this.convertFonts(answers, filesNames);
        });
      }
    }, (error) => {
      console.log(error.message);
    });
  }

  static convertFonts(answers, filesNames){
    const fontConverter = new FontConverter();
    this.conversionQueue = [];

    console.log('Converting...');

    answers.fontExtensions.forEach((fontFormat) => {
      if (fontFormat === '.ttf')
        return;

      filesNames.forEach((fileName) => {
        this.conversionQueue.push(fontConverter.convert(fileName.value, fontFormat));
      });
    });

    q.allSettled(this.conversionQueue).then((filesNamesWithExtension) => {
      convertSpinner.stop(true);
      console.log('acabou')
      this.createOrUseDirectory('fonts');

      filesNamesWithExtension.forEach((fileNameAndExtension) => {
        fs.createReadStream('tmp/' + fileNameAndExtension.value)
          .pipe(fs.createWriteStream('fonts/' + fileNameAndExtension.value));
      });

      this.createFontFaceFile(answers.fontExtensions, filesNames);
    });
  }

  static createFontFaceFile(answers, filesNames){
    const fontFaceCreator = new FontFaceCreator();
    this.createOrUseDirectory('css');

    filesNames.forEach((fileName) => {
      fontFaceCreator.createFontFace(fileName.value, answers.slice());
    });

    fs.stat('css/fonts.css', (error, stat) => {
      if (stat){
        inquirer.prompt([{
          type: 'confirm',
          pageSize: 10,
          message: 'css/fonts.css already exists. Overwrite?',
          name: 'overwrite'
        }], (answer) => {
          if (answer.overwrite)
            fs.writeFile('css/fonts.css', fontFaceCreator.output, (error) => {
              if (error) throw error;

              console.log('√ Fonts placed in /fonts and font face overwritten in /css.'.green);
            });
        });
      }else
        fs.writeFile('css/fonts.css', fontFaceCreator.output, (error) => {
          if (error) throw error;

          console.log('√ Fonts placed in /fonts and font face in /css.'.green);
        });
    })
  }

  static execute(){
    checkUpdate({packageName: pkg.name, packageVersion: pkg.version, isCLI: true}, (error, latestVersion, defaultMessage) => {
      if (!error)
        console.log(defaultMessage);
    });

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

    var command = yargs.argv._[0];

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

      this.cleanDirectory('tmp');
      this.chooseFonts();
    }
  }
}

CLI.execute();