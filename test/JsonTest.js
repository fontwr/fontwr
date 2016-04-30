'use strict';

const chai = require('chai'),
  assert = chai.assert,
  sinon = require('sinon'),
  Json = require('../lib/Json.js'),
  Util = require('../lib/Util.js'),
  fs = require('fs');

describe('Json methods requirements',()=>{
  var sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('readFile(): Should have a readFileSync method', () => {
    var readFileSpy = sandbox.spy(fs, 'readFileSync');

    Json.readFile();
    sinon.assert.calledOnce(readFileSpy);
  });

  it('save(): Should have a createWriteStream method', () => {
    var writeFileSpy = sandbox.spy(fs,'createWriteStream');
    var obj = {
      'fonts': {
        'Roboto-Regular': {
          'family': 'roboto',
          'format': ['.woff2', '.woff', '.eot']
        }
      },
      'systemFonts': {
        'Nexa-Light': {
          'format': ['.woff2']
        }
      }
    };

    Json.save(JSON.stringify(obj,null,'\t'));
    sinon.assert.calledOnce(writeFileSpy);
  });
});

describe('Json rules',()=>{
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
    var addedFont = Json.addFont('Roboto-Light',this.roboto['Roboto-Light']);
    assert.equal(addedFont,true);
  });

  it('addSystemFont(): Should add Verdana-Regular font', ()=> {
    var addedFont = Json.addSystemFont('Verdana-Regular',this.verdana['Verdana-Regular']);
    assert.equal(addedFont,true);
  });

  it('changeOutput(): Should change fonts output', ()=> {
    var output = Json.changeOutput(this.output['output']);
    assert.equal(output,true);
  });

  it('getFontByName(): Should return the Roboto-Regular font', ()=> {
    var font = Json.getFontByName('Roboto-Regular');
    assert.deepEqual(font,this.roboto['Roboto-Regular']);
  });

  it('getFontsByFamily(): Should return the entire roboto tree', ()=> {
    var fonts = Json.getFontsByFamily('roboto');
    assert.deepEqual(fonts,this.roboto);
  });

  it('removeFont(): Should remove the Roboto-Light font', ()=> {
    var result = Json.removeFont('Roboto-Light');
    assert.equal(result,true);
  });

  it('removeSystemFont(): Should remove the Verdana-Regular font', ()=> {
    var result = Json.removeSystemFont('Verdana-Regular');
    assert.equal(result,true);
  });

  it('get(): Should get a property', ()=> {
    var output = Json.get('output');
    assert.deepEqual(output,this.output['output']);
  });
});
