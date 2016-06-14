'use strict';

const CLI = require('../src/CLI.js'),
  Util = require('../lib/Util.js'),
  inquirer = require('inquirer'),
  chai = require('chai'),
  assert = chai.assert,
  wget = require('wget'),
  EventEmitter = require('events').EventEmitter,
  sinon = require('sinon'),
  promisify = require('es6-promisify'),
  fs = require('fs'),
  nock = require('nock');

require('events').EventEmitter.defaultMaxListeners = Infinity;

chai.use(require('chai-fs'));

const readFile = promisify(fs.readFile);
const access = promisify(fs.access);
const unlink = promisify(fs.unlink);

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

describe('CLI generating fontwr.json', () => {
  afterEach(() => {
    return access('fontwr.json', fs.F_OK).then(() => unlink('fontwr.json'));
  });

  it('execute(): Should add Roboto-Light to fontwr.json', () => {
    var fileFixtureRoboto,
      parameters = {
        command: 'add',
        fontName: 'roboto/Roboto-Light'
      };

    return Util.loadFixture('test/fixture/Jsonify/' +
    'fontwrJsonRobotoLightAllFormats.json', 'utf8')
    .then((fixture) => {
      fileFixtureRoboto = fixture;
    })
    .then(() => CLI.execute(parameters))
    .then(() => readFile('fontwr.json', 'utf8'))
    .then((fontwrJsonFile) => {
      assert.equal(fontwrJsonFile, fileFixtureRoboto);
    });
  });

  it('execute(): Should add Roboto-Light and OpenSans-Regular to fontwr.json',
    () => {
      var fileFixtureRobotoAndOpenSans,
        fontRobotoLight = {
          command: 'add',
          fontName: 'roboto/Roboto-Light'
        },
        fontOpenSansRegular = {
          command: 'add',
          fontName: 'opensans/OpenSans-Regular'
        };

      return Util.loadFixture('test/fixture/Jsonify/' +
        'fontwrJsonRobotoLightAndOpenSansRegularAllFormats.json', 'utf8')
      .then((fixture) => {
        fileFixtureRobotoAndOpenSans = fixture;
      })
      .then(() => CLI.execute(fontRobotoLight))
      .then(() => CLI.execute(fontOpenSansRegular))
      .then(() => readFile('fontwr.json', 'utf8'))
      .then((fontwrJsonFile) => {
        assert.equal(fontwrJsonFile, fileFixtureRobotoAndOpenSans);
      });
    });

  it('execute(): Should remove Roboto-Light from fontwr.json', () => {
    var fileFixtureRobotoRegular,
      fontRobotoLight = {
        command: 'add',
        fontName: 'roboto/Roboto-Light'
      },
      fontRobotoRegular = {
        command: 'add',
        fontName: 'roboto/Roboto-Regular'
      },
      fontRemoveRobotoLight = {
        command: 'remove',
        fontName: 'roboto/Roboto-Light'
      };

    return Util.loadFixture('test/fixture/Jsonify/' +
      'fontwrJsonRobotoRegular.json', 'utf8')
    .then((fixture) => {
      fileFixtureRobotoRegular = fixture;
    })
    .then(() => CLI.execute(fontRobotoLight))
    .then(() => CLI.execute(fontRobotoRegular))
    .then(() => CLI.execute(fontRemoveRobotoLight))
    .then(() => readFile('fontwr.json', 'utf8'))
    .then((fontwrJsonFile) => {
      assert.equal(fontwrJsonFile, fileFixtureRobotoRegular);
    });
  });

  it('execute(): Should remove roboto tree from fontwr.json', () => {
    var fileFixtureOpenSansRegular,
      fontRobotoLight = {
        command: 'add',
        fontName: 'roboto/Roboto-Light'
      },
      fontRobotoRegular = {
        command: 'add',
        fontName: 'roboto/Roboto-Regular'
      },
      fontOpenSansRegular = {
        command: 'add',
        fontName: 'opensans/OpenSans-Regular'
      },
      fontRemoveRobotoLight = {
        command: 'remove',
        fontName: 'roboto'
      };

    return Util.loadFixture('test/fixture/Jsonify/' +
      'fontwrJsonOpenSansRegular.json', 'utf8')
    .then((fixture) => {
      fileFixtureOpenSansRegular = fixture;
    })
    .then(() => CLI.execute(fontRobotoLight))
    .then(() => CLI.execute(fontRobotoRegular))
    .then(() => CLI.execute(fontOpenSansRegular))
    .then(() => CLI.execute(fontRemoveRobotoLight))
    .then(() => readFile('fontwr.json', 'utf8'))
    .then((fontwrJsonFile) => {
      assert.equal(fontwrJsonFile, fileFixtureOpenSansRegular);
    });
  });
});
