'use strict';

const path = require('path');
const fs = require('fs');

module.exports = class Json{

  constructor(){
    this.file = path.join(process.cwd(),'fontwr.json');
    this.json = this.readFile() || {};
  }

  fileExists(){
    try{
      return fs.statSync(this.file).isFile();
    } catch (err) {
      if(err.message != 'ENOENT')
        throw err;
    }
  }

  readFile(){
    if(this.fileExists()){
      var file = fs.readFileSync(this.file);
      var json = JSON.parse(file);
      return json;
    }
  }

  toString(){
    this.json = JSON.stringify(this.json,null,'\t');
    return this.json;
  }

  get(property){
    return this.json[property];
  }

  getFontByName(name){
    if (this.json.fonts.hasOwnProperty(name))
      return this.json.fonts[name];
    if (this.json.systemFonts.hasOwnProperty(name))
      return this.json.systemFonts[name];

    return false;
  }

  getFontsByFamily(name){
    var result = this.json.fonts;

    for (var font in this.json.fonts)
      for (var key in this.json.fonts[font])
        if(key.toString() === 'family' && this.json.fonts[font][key] !== name)
          delete result[font];

    return result;
  }

  addFont(name,object){
    if(this.json.fonts.hasOwnProperty(name))
      throw new Error('You already have installed this font');
    else {
      this.json.fonts[name] = object;
      return this;
    }
  }

  addSystemFont(name,object){
    if(this.json.systemFonts.hasOwnProperty(name))
      throw new Error('You already have installed this font');
    else {
      this.json.systemFonts[name] = object;
      return this;
    }
  }

  removeFont(name){
    if(this.json.fonts.hasOwnProperty(name)){
      delete this.json.fonts[name];
      return this;
    } else
      throw new Error('You dont have installed this font');
  }

  removeSystemFont(name){
    if(this.json.systemFonts.hasOwnProperty(name)){
      delete this.json.systemFonts[name];
      return this;
    } else
      throw new Error('You dont have installed this font');
  }

  removeFontFamily(name){
    for (var font in this.json.fonts)
      for (var key in this.json.fonts[font])
        if(key.toString() === 'family' && this.json.fonts[font][key] === name)
          delete this.json.fonts[font];

    return this;
  }

  changeOutput(object){
    delete this.json['output'];
    this.json['output'] = object;
    return this;
  }

  save(){
    try {
      var writeStream = fs.createWriteStream(this.file,{flag: 'w'});
      writeStream.write(this.toString());
      writeStream.end();
    } catch (err) {
      throw err;
    }
  }
};
