'use strict';

const jsonFile = require('json-file-plus');
const path = require('path');

module.exports = class Json{
  constructor(){
    this.file = path.join(process.cwd(), 'fontwr.json');
  }

  get(name,options){
    return new Promise((resolve, reject) => {
      jsonFile(this.file, (err, file) => {
        if (err)
          reject(new Error(err));
        file.get('fonts').then((data) => {
          if (data.hasOwnProperty(name)) {
            if (options) {
              if (data[name].hasOwnProperty(options)) {
                resolve(data[name][options]);
              } else {
                reject(new Error('You don\'t have this font installed, try to install it or check your fontwr.json file.'));
              }
            } else {
              resolve(data[name]);
            }
          } else {
            reject(new Error('You don\'t have this font family installed, try to install it or check your fontwr.json file.'));
          }
        }).catch((err) => {
          reject(new Error('You don\'t have any fonts installed yet, try to install fonts or check your fontwr.json file.'));
        });
      });
    });
  }

  getFromSystem(name,options){
    return new Promise((resolve, reject) => {
      jsonFile(this.file, (err, file) => {
        if (err)
          reject(new Error(err));
        file.get('systemFonts').then((data) => {
          if (data.hasOwnProperty(name)) {
            if (options) {
              if (data[name].hasOwnProperty(options)) {
                resolve(data[name][options]);
              } else {
                reject(new Error('You don\'t have this system font installed, try to install it or check your fontwr.json file.'));
              }
            } else {
              resolve(data[name]);
            }
          } else {
            reject(new Error('You don\'t have this system font family installed, try to install it or check your fontwr.json file.'));
          }
        }).catch((err) => {
          reject(new Error('You don\'t have any system fonts installed yet, try to install fonts or check your fontwr.json file.'));
        });
      });
    });
  }

  output(){
    return new Promise((resolve,reject) => {
      jsonFile(this.file, (err, file) => {
        if (err)
          reject(new Error(err));
        file.get('output').then((data) => {
          resolve(data);
        }).catch((err) => {
          reject(new Error('Output settings not found in fontwr.json. Using default fontwr output.'));
        });
      });
    });
  }

};
