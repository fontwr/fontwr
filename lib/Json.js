'use strict';

const path = require('path');
const fs = require('fs');

module.exports = class Json{

  constructor(){
    this.json = null;
    this.file = path.join(process.cwd(),'fontwr.json');
  }

  readFile(){
    try {
      var file = fs.readFileSync(this.file);
      this.json = JSON.parse(file);
      return this.json;
    } catch (err) {
      throw err;
    }
  }

  populate(){
    if(this.json === null)
      this.readFile();
  }

  toString(){
    this.json = JSON.stringify(this.json,null,'\t');
    return this.json;
  }

  get(property){
    this.populate();
    return this.json[property];
  }

  getFontByName(name){
    this.populate();
    if (this.json.fonts.hasOwnProperty(name))
      return this.json.fonts[name];
    if (this.json.systemFonts.hasOwnProperty(name))
      return this.json.systemFonts[name];

    return false;
  }

  getFontsByFamily(name){
    this.populate();
    var result = this.json.fonts;

    for (var font in this.json.fonts)
      for (var key in this.json.fonts[font])
        if(key.toString() === 'family' && this.json.fonts[font][key] !== name)
          delete result[font];

    return result;
  }

  addFont(name,object){
    this.populate();
    if(this.json.fonts.hasOwnProperty(name))
      throw new Error('You already have installed this font');
    else {
      this.json.fonts[name] = object;
      return this;
    }
  }

  addSystemFont(name,object){
    this.populate();
    if(this.json.systemFonts.hasOwnProperty(name))
      throw new Error('You already have installed this font');
    else {
      this.json.systemFonts[name] = object;
      return this;
    }
  }

  removeFont(name){
    this.populate();
    if(this.json.fonts.hasOwnProperty(name)){
      delete this.json.fonts[name];
      return this;
    } else
      throw new Error('You dont have installed this font');
  }

  removeSystemFont(name){
    this.populate();
    if(this.json.systemFonts.hasOwnProperty(name)){
      delete this.json.systemFonts[name];
      return this;
    } else
      throw new Error('You dont have installed this font');
  }

  removeFontFamily(name){
    this.populate();

    for (var font in this.json.fonts)
      for (var key in this.json.fonts[font])
        if(key.toString() === 'family' && this.json.fonts[font][key] === name)
          delete this.json.fonts[font];

    return this;
  }

  changeOutput(object){
    this.populate();
    delete this.json['output'];
    this.json['output'] = object;
    return this;
  }

  save(){
    try {
      var writeStream = fs.createWriteStream(this.file);
      writeStream.write(this.toString());
      writeStream.end();
      return true;
    } catch (err) {
      throw err;
    }
  }
};
