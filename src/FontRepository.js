'use strict';

const _ = require('underscore');
const wget = require('wget');
const https = require('follow-redirects').https;

module.exports = class FontRepository {
  constructor() {
    this.baseRawPath = 'https://raw.githubusercontent.com/raphaklaus/' +
      'fontwr-fonts/master/fonts/';
    this.baseAPIPath = 'api.github.com';
    this.repositoryPath = '/repos/raphaklaus/fontwr-fonts/contents/fonts/';
    this.output = 'tmp/';
  }

  set fontName(value) {
    this._fontName = value.toLowerCase();
  }

  get fontName() {
    return this._fontName;
  }

  verify() {
    return new Promise((resolve, reject) => {
      var options = {
        host: this.baseAPIPath,
        path: this.repositoryPath + this._fontName,
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'fontwr'
        }
      };

      https.get(options, (res) => {
        var body = [];
        if (res.statusCode === 200) {
          res.on('data', (chunk) => {
            body += chunk;
          });

          res.on('end', () => {
            resolve(JSON.parse(body));
          });
        } else if (res.statusCode === 404)
          reject(new Error('Font not found. Try running the command:'+
            ' fontwr list'));
        else
          reject(new Error('HTTP Status Code: ' + res.statusCode));
      }).on('error', (e) => {
        reject(e);
      }).end();
    });
  }

  download(fileName) {
    return new Promise((resolve, reject) => {
      wget.download(this.baseRawPath + this._fontName + '/' + fileName + '.ttf',
      this.output + fileName + '.ttf')
      .on('error', (error) => {
        reject(new Error(error));
      })
      .on('end', () => {
        resolve(fileName);
      });
    });
  }

  list() {
    return new Promise((resolve, reject) => {
      var options = {
        host: this.baseAPIPath,
        path: this.repositoryPath,
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'fontwr'
        }
      };

      https.get(options, (res) => {
        var body = [];
        if (res.statusCode === 200) {
          res.on('data', (chunk) => {
            body += chunk;
          });

          res.on('end', () => {
            resolve(_.pluck(JSON.parse(body), 'name'));
          });
        } else if (res.statusCode === 404)
          reject(new Error('Something were wrong. ' +
        'Repository not found: ' + this.baseAPIPath + this.repositoryPath));
        else
          reject(new Error('HTTP Status Code: ' + res.statusCode));
      }).on('error', (error) => {
        reject(error);
      }).end();
    });
  }
};
