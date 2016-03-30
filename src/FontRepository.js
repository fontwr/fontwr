'use strict';

const _ = require('underscore');
const q = require('q');
const wget = require('wget');
const https = require('follow-redirects').https;

module.exports = class FontRepository{
  constructor(){
    this.baseRawPath = 'https://raw.githubusercontent.com/raphaklaus/fontwr-fonts/master/fonts/';
    this.baseAPIPath = 'api.github.com';
    this.repositoryPath = '/repos/raphaklaus/fontwr-fonts/contents/fonts/';
    this.output = 'tmp/';
  }

  setFontName(fontName){
    this.fontName = fontName.toLowerCase();
  }

  verify(){
    var deferred = q.defer();
    var options = {
      host: this.baseAPIPath,
      path: this.repositoryPath + this.fontName,
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'fontwer'
      },
      method: 'GET'
    };

    https.request(options, (res) => {
      var body = [];
      if (res.statusCode === 200){
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          deferred.resolve(JSON.parse(body));
        });
      }
      else if (res.statusCode === 404)
        deferred.reject(new Error('Font not found. Try running the command: fontwr list'));
      else
        deferred.reject(new Error('HTTP Status Code: ' + res.statusCode));
    }).on('error', (e) => {
      deferred.reject(new Error(e));
    })
    .end();

    return deferred.promise;
  }

  download(fileName){
    var deferred = q.defer();
    wget.download(this.baseRawPath + this.fontName + '/' + fileName + '.ttf', this.output + fileName + '.ttf')
      .on('error', (err) => {
        deferred.reject(new Error(err));
      })
      .on('end', () => {
        deferred.resolve(fileName);
      });
    return deferred.promise;
  }

  list(){
    var deferred = q.defer();
    var options = {
      host: this.baseAPIPath,
      path: this.repositoryPath,
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'fontwer'
      },
      method: 'GET'
    };

    https.request(options, (res) => {
      var body = [];
      if (res.statusCode === 200){
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          deferred.resolve(_.pluck(JSON.parse(body), 'name'));
        });
      }
      else if (res.statusCode === 404)
        deferred.reject(new Error('Something were wrong. Repository not found: ' + this.baseAPIPath + this.repositoryPath));
      else
        deferred.reject(new Error('HTTP Status Code: ' + res.statusCode));
    }).on('error', (error) => {
      deferred.reject(new Error(error));
    })
    .end();

    return deferred.promise;
  }
};