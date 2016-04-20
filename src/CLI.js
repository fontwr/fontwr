'use strict';

const q = require('q'),
  inquirer = require('inquirer'),
  fs = require('fs'),
  FontRepository = require('./FontRepository'),
  FontConverter = require('./FontConverter'),
  FontFaceCreator = require('./FontFaceCreator'),
  cpr = require('cpr'),
  pkg = require('../package.json'),
  checkUpdate = require('check-update'),
  colors = require('colors'),
  winston = require('winston'),
  Util = require('../lib/util.js'),
  Spinner = require('cli-spinner').Spinner;

class CLI{
  static filter(fonts){
    var filteredFonts = [];
    fonts.forEach((font) =>{
      if (font.name.match(/.ttf$/i))
        filteredFonts.push(font.name.replace(/.ttf$/i, ''));
    });
    return filteredFonts;
  }

  static listAllFonts(){
    this.fontRepository.list().then((list) => {
      list.forEach((element) => {
        CLI.logger.log('verbose', '- ' + element);
      });
    }, (error) => {
      CLI.logger.log('verbose', error.message.error);
    });
  }

  static registerFonts(filesNames){
    const regedit = require('regedit');
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
          CLI.logger.log('verbose', error);
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
        CLI.logger.log('verbose', error);
      else if (process.platform === 'win32')
        CLI.registerFonts(filesNames);

      CLI.logger.log('verbose',
        '√ Fonts copied to system\'s fonts directory.'.green);
    });
  }

  static chooseFonts(){
    return new Promise((resolve, reject) => {
      return CLI.fontRepository.verify().then((data) => {
        return inquirer.prompt([{
          type: 'checkbox',
          pageSize: 10,
          message: 'Choose the Font Family:',
          name: 'fontFamilies',
          choices: CLI.filter(data),
          validate: (answers) => {
            if (answers.length === 0)
              return 'You must choose at least 1 font.';
            return true;
          }
        }], (answers) => {
          resolve(answers);
        });
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  static downloadFonts(fonts){
    return new Promise((resolve, reject) => {
      var downloadQueue = [];
      fonts.fontFamilies.forEach((fontFamily) => {
        downloadQueue.push(CLI.fontRepository.download(fontFamily));
      });

      var downloadSpinner = new Spinner('Downloading.. %s');
      downloadSpinner.setSpinnerString('|/-\\');
      downloadSpinner.start();

      return Promise.all(downloadQueue).then((filesNames) => {
        downloadSpinner.stop(true);
        resolve(filesNames);
      }, (error) => {
        reject(error);
      });
    });
  }

  static convertFonts(filesNames){
    return new Promise((resolve, reject) => {
      return inquirer.prompt([{
        type: 'checkbox',
        pageSize: 10,
        message: 'Select which formats you want inside the font-face:',
        name: 'extensions',
        choices: [{name: '.woff2'}, {name: '.woff'},
        {name: '.eot'}, {name: '.ttf'}],
        validate: function(answers){
          if (answers.length === 0)
            return 'You must choose at least 1 format.';
          return true;
        }
      }], (answers) => {
        var conversionQueue = [];

        // todo: use spinner here too
        CLI.logger.log('verbose', 'Converting...');

        answers.extensions.forEach((fontFormat) => {
          if (fontFormat === '.ttf')
            return;

          filesNames.forEach((fileName) => {
            conversionQueue
              .push(CLI.fontConverter.convert(fileName, fontFormat));
          });
        });

        q.allSettled(conversionQueue).then((filesNamesWithExtension) => {
          Util.createOrUseDirectory('fonts');

          filesNamesWithExtension.forEach((fileNameAndExtension) => {
            fs.createReadStream('tmp/' + fileNameAndExtension.value)
            .pipe(fs.createWriteStream('fonts/'
              + fileNameAndExtension.value));
          });

          var result = {
            filesNames: filesNames,
            fontExtensions: answers.extensions
          };

          resolve(result);
          // this.createFontFaceFile(answers.fontExtensions, filesNames);
        }, (error) => {
          reject(error);
        });
        // var result = {
        //   fontExtensions: answers.extensions,
        //   filesNames: filesNames
        // };
        //
        // resolve(result);
        // this.convertFonts(answers, filesNames);
      });
    });
  }

  static createFontFaceFile(fontsInfo){
    return new Promise((resolve, reject) => {
      Util.createOrUseDirectory('css');

      fontsInfo.filesNames.forEach((fileName) => {
        CLI.fontFaceCreator.createFontFace(fileName,
          fontsInfo.fontExtensions.slice());
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
              fs.writeFile('css/fonts.css', CLI.fontFaceCreator.output,
              (error) => {
                if (error)
                  reject(error);
                else {
                  resolve();
                  CLI.logger.log('verbose', '√ Fonts placed '.green +
                  'in /fonts and font face overwritten in /css.'.green);
                }
              });
          });
        } else
        fs.writeFile('css/fonts.css', CLI.fontFaceCreator.output, (error) => {
          if (error)
            reject(error);
          else {
            resolve();
            CLI.logger.log('verbose',
              '√ Fonts placed in /fonts and font face in /css.'.green);
          }
        });
      });
    });
  }

  static useExternalArguments(args, external){
    args.command = external.command;
    args.fontName = external.fontName;
    args.global = external.global;
  }

  static useYargs(args, yargs){
    args.command = yargs.argv._[0];
    args.fontName = yargs.argv._[1];
    args.global = yargs.argv.g;
  }

  static execute(externalArguments){
    var args = {};
    var yargs = {};

    this.logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          handleExceptions: true,
          showLevel: false
        })
      ],
      exitOnError: false
    });

    this.fontRepository = new FontRepository();
    this.fontConverter = new FontConverter();
    this.fontFaceCreator = new FontFaceCreator();

    checkUpdate({packageName: pkg.name,
      packageVersion: pkg.version,
      isCLI: true},
      (error, latestVersion, defaultMessage) => {
        if (!error)
          CLI.logger.log('verbose', defaultMessage);
      });

    if (externalArguments)
      CLI.useExternalArguments(args, externalArguments);
    else {
      yargs = require('yargs')
        .usage('fontwr <command> [options]')
        .demand(1)
        .help('h')
        .command('list', 'List all availables fonts')
        .command('get', 'List all availables fonts')
        .example('fontwr get opensans', 'Get Open Sans font')
        .example('fontwr roboto -g', 'Get Roboto and' +
        'install into system\'s font directory')
        .describe('h', 'Show this help')
        .describe('g', 'Download font to the system\'s font directory')
        .alias('h', 'help');

      this.logger.level = 'verbose';
      CLI.useYargs(args, yargs);
    }

    if (args.command === 'list')
      CLI.listAllFonts();
    else if (args.command === 'get'){
      if (!externalArguments)
        yargs.reset()
          .demand(2)
          .example('fontwr get opensans', 'Get Open Sans font')
          .example('fontwr get roboto -g',
          'Get Roboto and install into system\'s font directory')
          .argv;

      this.fontRepository.fontName = args.fontName;
      this.global = args.global;

      Util.createOrUseDirectory('tmp');
      Util.cleanDirectory('tmp');

      if (this.global){
        return this.chooseFonts()
          .then(this.downloadFonts)
          .then(this.copyToSystemFontDirectory);
      } else {
        return this.chooseFonts()
          .then(this.downloadFonts)
          .then(this.convertFonts)
          .then(this.createFontFaceFile);
      }
    }
  }
}

module.exports = CLI;
