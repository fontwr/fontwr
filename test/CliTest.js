'use strict';

const CLI = require('../src/CLI.js'),
  Util = require('../lib/Util.js'),
  inquirer = require('inquirer'),
  chai = require('chai'),
  assert = chai.assert,
  wget = require('wget'),
  EventEmitter = require('events').EventEmitter,
  sinon = require('sinon'),
  nock = require('nock');

chai.use(require('chai-fs'));

describe('CLI rules', () => {
  var inquirerStub = {};
  var sandbox = {};

  beforeEach(() => {
    Util.cleanDirectory('tmp');
    Util.cleanDirectory('fonts');
    Util.cleanDirectory('css');
    sandbox = sinon.sandbox.create();
    inquirerStub = sandbox.stub(inquirer, 'prompt');
  });

  afterEach(() => {
    inquirer.prompt.restore();
    sandbox.restore();
  });

  it('execute(): Should choose, download, convert and write css file', () => {
    var fixture = [{
      name: 'roboto'
    }];

    nock('https://api.github.com')
    .get('/repos/raphaklaus/fontwr-fonts/contents/fonts/roboto')
    .reply(200, fixture);

    Util.createOrUseDirectory('tmp');
    Util.cleanDirectory('tmp');

    inquirerStub.onCall(0).yields({fontFamilies: ['Roboto-Regular']});
    inquirerStub.onCall(1).yields({extensions: ['.woff', '.eot']});

    return Util.loadFixture('test/fixture/FontConverter/Roboto-Regular.ttf')
      .then((data) => {
        sandbox.stub(wget, 'download', () => {
          var eventEmitter = new EventEmitter();
          Util.writeInTmp(data, 'Roboto-Regular').then(() => {
            setImmediate(() => {
              eventEmitter.emit('end');
            });
          });
          return eventEmitter;
        });

        var parameters = {
          command: 'get',
          fontName: fixture[0].name,
          global: false
        };

        return CLI.execute(parameters).then(() => {
          assert.notIsEmptyDirectory('css');
          assert.notIsEmptyDirectory('fonts');
          assert.notIsEmptyDirectory('tmp');
          assert.isFile('css/fonts.css');
          assert.isFile('fonts/Roboto-Regular.woff');
          assert.isFile('fonts/Roboto-Regular.eot');
          assert.isFile('tmp/Roboto-Regular.ttf');
          assert.isFile('tmp/Roboto-Regular.woff');
          assert.isFile('tmp/Roboto-Regular.eot');
        });
      });
  });
});
