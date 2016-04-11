'use strict';
const chai = require('chai'),
  assert = chai.assert,
  sinon = require('sinon'),
  FontRepository = require('../src/FontRepository.js'),
  _ = require('underscore'),
  https = require('follow-redirects').https,
  wget = require('wget'),
  EventEmitter = require('events').EventEmitter,
  nock = require('nock');

describe('FontRepository methods requirements', () => {
  var fontRepository = new FontRepository();
  it('verify(): Should have a get method', () => {
    var method = sinon.spy(https, 'get');

    fontRepository.verify();
    method.restore();
    sinon.assert.calledOnce(method);
  });

  it('list(): Should have a get method', () => {
    var method = sinon.spy(https, 'get');

    fontRepository.list();
    method.restore();
    sinon.assert.calledOnce(method);
  });

  it('download(): Should have a download method', () => {
    var method = sinon.spy(wget, 'download');
    fontRepository.download();
    sinon.assert.calledOnce(method);
    wget.download.restore();
  });
});

describe('FontRepository rules', () => {
  var fontRepository = new FontRepository();
  var fixture =  {
    name: 'Roboto'
  };

  it('download(): Should download file', () => {
    fontRepository.fontName = 'test';

    sinon.stub(wget, 'download', () => {
      var eventEmitter = new EventEmitter();
      setImmediate(() => {
        eventEmitter.emit('end');
      });
      return eventEmitter;
    });

    return fontRepository.download('test').then((data) => {
      assert.equal(fontRepository.fontName, data);
    }, () => {
      throw new Error('Expected to be a 200');
    }).fin(() => {
      wget.download.restore();
    });
  });

  it('download(): Should get an error', () => {
    sinon.stub(wget, 'download', () => {
      var eventEmitter = new EventEmitter();
      setTimeout(() => {
        eventEmitter.emit('error');
      }, 0);
      return eventEmitter;
    });

    return fontRepository.download('test').then(() => {
      throw new Error('Expected to be an error');
    }, () => {
      assert(true);
    }).fin(() => {
      wget.download.restore();
    });
  });

  it('verify(): Should get font directory', () => {
    fontRepository.fontName = 'test';

    var statusCode = 200;

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath + fontRepository.fontName)
      .reply(statusCode, fixture);

    return fontRepository.verify().then(function(data){
      assert.deepEqual(fixture, data);
    }, () => {
      throw new Error('Expected to be a 200');
    });
  });

  it('verify(): Should not find font directory', () => {
    fontRepository.fontName = 'test';
    var statusCode = 404;

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath + fontRepository.fontName)
      .reply(statusCode, fixture);

    return fontRepository.verify().then(() => {
      throw new Error('Expected to be a 404');
    }, function(error){
      assert.equal(error.message, new Error('Font not found. Try running the command: fontwr list').message);
    });
  });

  it('verify(): Should get 403 error for font directory', () => {
    fontRepository.fontName = 'test';
    var statusCode = 403;

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath + fontRepository.fontName)
      .reply(statusCode, fixture);

    return fontRepository.verify().then(() => {
      throw new Error('Expected to be a 403');
    }, function(error){
      assert.equal(error.message, new Error('HTTP Status Code: ' + statusCode).message);
    });
  });

  it('verify(): Should get an request error', () => {
    fontRepository.fontName = 'test';
    var errorMessage = 'Request error';

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath + fontRepository.fontName)
      .replyWithError(errorMessage);

    return fontRepository.verify().then(() => {
      throw new Error('Expected to be an error.');
    }, function(error){
      assert.equal(error.message, new Error(errorMessage).message);
    });
  });

  it('list(): Should get font list', () => {
    var statusCode = 200;

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath)
      .reply(statusCode, fixture);

    return fontRepository.list().then(function(data){
      assert.deepEqual(_.pluck(fixture, 'name'), data);
    }, () => {
      throw new Error('Expected to be a 200');
    });
  });

  it('list(): Should not find font repository', () => {
    var statusCode = 404;

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath)
      .reply(statusCode, fixture);

    return fontRepository.list().then(() => {
      throw new Error('Expected to be a 404');
    }, function(error){
      assert.equal(error.message, new Error('Something were wrong. Repository not found: ' + fontRepository.baseAPIPath + fontRepository.repositoryPath).message);
    });
  });

  it('list(): Should get 403 error for list', () => {
    var statusCode = 403;

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath)
      .reply(statusCode, fixture);

    return fontRepository.list().then(() => {
      throw new Error('Expected to be a 403');
    }, function(error){
      assert.equal(error.message, new Error('HTTP Status Code: ' + statusCode).message);
    });
  });

  it('list(): Should get an request error', () => {
    var errorMessage = 'Request error';

    nock('https://' + fontRepository.baseAPIPath)
      .get(fontRepository.repositoryPath)
      .replyWithError(errorMessage);

    return fontRepository.list().then(() => {
      throw new Error('Expected to be an error.');
    }, function(error){
      assert.equal(error.message, new Error(errorMessage).message);
    });
  });
});