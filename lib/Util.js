'use strict';

const fs = require('fs'),
  rimraf = require('rimraf');

module.exports = class Util {
  static createOrUseDirectory(directory, callback) {
    try {
      fs.mkdirSync(directory);
    } catch (error) {
      if (error.code === 'EEXIST') {
        if (callback)
          callback();
      } else
        throw error;
    }
  }

  static cleanDirectory(directory) {
    rimraf.sync(directory + '/*');
  }

  static loadFixture(path, encoding) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, encoding, (error, data) => {
        if (error) reject(new Error(error));
        resolve(data);
      });
    });
  }

  static writeInTmp(data, fileName) {
    return new Promise((resolve, reject) => {
      fs.writeFile('tmp/' + fileName + '.ttf', data, (error) => {
        if (error) reject(new Error(error));
        resolve(data);
      });
    });
  }
};
