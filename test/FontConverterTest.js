'use strict';
const chai = require('chai'),
  assert = chai.assert,
  sinon = require('sinon'),
  FontConverter = require('../src/FontConverter.js'),
  isEot = require('is-eot'),
  isWoff = require('is-woff'),
  chaiAsPromised = require('chai-as-promised'),
  readChunk = require('read-chunk'),
  Util = require('../lib/Util.js'),
  fs = require('fs');

chai.use(chaiAsPromised);
Util.createOrUseDirectory('tmp');

describe('FontConverter methods requirements', () => {
  var fontConverter = new FontConverter();
  var sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('convert(): Should have a readFile method', () => {
    var readFileSpy = sandbox.spy(fs, 'readFile');

    fontConverter.convert('test', '.woff');
    sinon.assert.calledOnce(readFileSpy);
  });

  it('convert(): Should have a writeFile method', () => {
    return Util.loadFixture('test/fixture/FontConverter/Roboto-Regular.ttf')
      .then((data) => {
        var writeFileSpy = sandbox.spy(fs, 'writeFile');
        sandbox.stub(fs, 'readFile').yields(null, data);

        fontConverter.convert('Roboto-Regular', '.woff');
        sinon.assert.calledOnce(writeFileSpy);
      }, (error) => {
        throw error;
      });
  });
});

describe('FontConverter rules', () => {
  var fontConverter = new FontConverter();
  var sandbox;

  beforeEach(() => {
    Util.cleanDirectory('tmp');
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('convert(): Should convert to .eot', () => {
    return Util.loadFixture('test/fixture/FontConverter/Roboto-Regular.ttf')
      .then((data) => {
        sandbox.stub(fs, 'readFile').yields(null, data);
        return fontConverter.convert('Roboto-Regular', '.eot').then(() => {
          let buffer = readChunk.sync('tmp/Roboto-Regular.eot', 0, 36);
          assert.equal(isEot(buffer), true);
        }, (error) => {
          throw error;
        });
      });
  });

  it('convert(): Should convert to .woff', () => {
    return Util.loadFixture('test/fixture/FontConverter/Roboto-Regular.ttf')
      .then((data) => {
        sandbox.stub(fs, 'readFile').yields(null, data);
        return fontConverter.convert('Roboto-Regular', '.woff').then(() => {
          let buffer = readChunk.sync('tmp/Roboto-Regular.woff', 0, 8);
          assert.equal(isWoff(buffer), true);
        }, (error) => {
          throw error;
        });
      });
  });

  //todo: Test woff2 conversion,
  // not done due: https://github.com/raphaklaus/fontwr/issues/13
  // it('convert(): Should convert to .woff2', () => {
  // });

  it('convert(): Should get error when reading file', () => {
    sandbox.stub(fs, 'readFile').yields(new Error());
    return assert.isRejected(fontConverter.convert('Roboto-Regular', '.eot'));
  });

  it('convert(): Should get error when writing to file', () => {
    return Util.loadFixture('test/fixture/FontConverter/Roboto-Regular.ttf')
      .then((data) => {
        sandbox.stub(fs, 'readFile').yields(null, data);
        sandbox.stub(fs, 'writeFile').yields(new Error());
        return assert
          .isRejected(fontConverter.convert('Roboto-Regular', '.eot'));
      });
  });
});
