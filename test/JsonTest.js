'use strict';

const chai = require('chai'),
  assert = chai.assert,
  sinon = require('sinon'),
  Json = require('../lib/Json.js'),
  Util = require('../lib/Util.js'),
  fs = require('fs');

describe('Json methods requirements',()=>{
  var json = new Json();
  var sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('save(): Should have a createWriteStream method', () => {
    var writeFileSpy = sandbox.spy(fs,'createWriteStream');
    json.addFont('Roboto-Regular', {
      'family': 'roboto',
      'format': [
        '.woff2',
        '.woff',
        '.eot'
      ]
    });
    json.save();
    sinon.assert.calledOnce(writeFileSpy);
  });

  it('fileExists(): Should have a statSync method', () => {
    var statSyncSpy = sandbox.spy(fs, 'statSync');

    json.fileExists();
    sinon.assert.calledOnce(statSyncSpy);
  });

  it('readFile(): Should have a readFileSync method', () => {
    var readFileSpy = sandbox.spy(fs, 'readFileSync');

    json.readFile();
    sinon.assert.calledOnce(readFileSpy);
  });
});

describe('Json rules',()=>{
  var json = new Json();

  beforeEach(() => {
    this.roboto = {
      'Roboto-Regular': {
        'family': 'roboto',
        'format': ['.woff2', '.woff', '.eot']
      },
      'Roboto-Light': {
        'family': 'roboto',
        'format': ['.woff2', '.woff']
      }
    };
    this.opensans = {
      'Opensans-Regular': {
        'family': 'opensans',
        'format': [
          '.woff2',
          '.woff'
        ]
      },
      'Opensans-Light': {
        'family': 'opensans',
        'format': [
          '.woff2',
          '.woff'
        ]
      }
    };
    this.nexa = {
      'Nexa-Light': {
        'format': ['.woff2']
      }
    };
    this.verdana = {
      'Verdana-Regular': {
        'format': ['.woff']
      }
    };
    this.output = {
      'output': {
        'fonts': 'fonts/',
        'fontface': 'css/'
      }
    };
  });

  it('addFont(): Should add Roboto-Light font', ()=> {
    return Util.loadFixture('test/fixture/Json/robotoLight.json')
      .then((data) => {
        json.addFont('Roboto-Light',this.roboto['Roboto-Light']);
        assert.deepEqual(json.json,JSON.parse(data));
      }, (error) => {
        throw error;
      });
  });

  it('addFont(): Should throw an Error', ()=> {
    assert.throws(
      json.addFont.bind(null, 'Roboto-Light',this.roboto['Roboto-Light'])
    );
  });

  it('multiple methods: Should add some fonts and remove entire roboto tree', ()=> {
    return Util.loadFixture('test/fixture/Json/removeFamily.json')
      .then((data) => {
        json.addFont('Opensans-Regular',this.opensans['Opensans-Regular'])
          .addSystemFont('Verdana-Regular',this.verdana['Verdana-Regular'])
          .removeFontFamily('roboto');
        assert.deepEqual(json.json,JSON.parse(data));
      }, (error) => {
        throw error;
      });
  });

  it('changeOutput(): Should change fonts output', ()=> {
    return Util.loadFixture('test/fixture/Json/output.json')
      .then((data) => {
        json.changeOutput(this.output['output']);
        assert.deepEqual(json.json,JSON.parse(data));
      }, (error) => {
        throw error;
      });
  });

  it('get(): Should get the output property', ()=> {
    return Util.loadFixture('test/fixture/Json/get.json')
      .then((data) => {
        var output = json.get('output');
        var parsed = JSON.parse(data);
        assert.deepEqual(output,parsed.output);
      }, (error) => {
        throw error;
      });
  });

  it('getFontByName(): Should return the Opensans-Regular font', ()=> {
    return Util.loadFixture('test/fixture/Json/get.json')
      .then((data) => {
        var font = json.getFontByName('Opensans-Regular');
        var parsed = JSON.parse(data);
        assert.deepEqual(font,parsed.fonts['Opensans-Regular']);
      }, (error) => {
        throw error;
      });
  });

  it('getFontsByFamily(): Should return the entire opensans tree', ()=> {
    return Util.loadFixture('test/fixture/Json/get.json')
      .then((data) => {
        json.addFont('Opensans-Light',this.opensans['Opensans-Light']);
        var fonts = json.getFontsByFamily('opensans');
        var parsed = JSON.parse(data);
        assert.deepEqual(fonts,parsed.fonts);
      }, (error) => {
        throw error;
      });
  });

  it('removeFont(), removeSystemFont(): Should remove Opensans-Regular and Verdana-Regular fonts', ()=> {
    return Util.loadFixture('test/fixture/Json/removeFonts.json')
      .then((data) => {
        json.removeFont('Opensans-Light')
          .removeSystemFont('Verdana-Regular');
        assert.deepEqual(json.json,JSON.parse(data));
      }, (error) => {
        throw error;
      });
  });
});
