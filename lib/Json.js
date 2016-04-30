'use strict';

const path = require('path');
const fs = require('fs');

module.exports = class Json{
  static getFile(){
    return path.join(process.cwd(),'fontwr.json');
  }

  static readFile(){
    try {
      return fs.readFileSync(this.getFile());
    } catch (err) {
      return err;
    }
  }

  static toJson(){
    return JSON.parse(this.readFile());
  }

  static toString(obj){
    return JSON.stringify(obj,null,'\t');
  }

  static get(property){
    var obj = this.toJson();
    return obj[property];
  }

  static getFontByName(name){
    var obj = this.toJson();
    if (obj.fonts.hasOwnProperty(name))
      return obj.fonts[name];
    if (obj.systemFonts.hasOwnProperty(name))
      return obj.systemFonts[name];

    return false;
  }

  static getFontsByFamily(name){
    var obj = this.toJson();
    var result = obj.fonts;
    for (var font in obj.fonts)
      for (var key in obj.fonts[font])
        if (key.toString() === 'family' && obj.fonts[font][key] !== name)
          delete result[font];
    return result;
  }

  static addFont(name,object){
    var obj = this.toJson();
    if(obj.fonts.hasOwnProperty(name))
      throw new Error('You already have installed this font');
    else {
      obj.fonts[name] = object;
      try{
        return this.save(this.toString(obj));
      } catch(err){
        throw err;
      }
    }
  }

  static addSystemFont(name,object){
    var obj = this.toJson();
    if(obj.systemFonts.hasOwnProperty(name))
      throw new Error('You already have installed this font');
    else {
      obj.systemFonts[name] = object;
      try{
        return this.save(this.toString(obj));
      } catch(err){
        throw err;
      }
    }
  }

  static removeFont(name){
    var obj = this.toJson();
    if(obj.fonts.hasOwnProperty(name)){
      delete obj.fonts[name];
      try{
        return this.save(this.toString(obj));
      } catch(err){
        throw err;
      }
    } else
      throw new Error('You dont have installed this font');
  }

  static removeSystemFont(name){
    var obj = this.toJson();
    if(obj.systemFonts.hasOwnProperty(name)){
      delete obj.systemFonts[name];
      this.save(this.toString(obj));
      try{
        return this.save(this.toString(obj));
      } catch(err){
        throw err;
      }
    } else
      throw new Error('You dont have installed this font');
  }

  static changeOutput(object){
    var obj = this.toJson();
    delete obj['output'];
    obj['output'] = object;
    try{
      return this.save(this.toString(obj));
    } catch(err){
      throw err;
    }
  }

  static save(obj){
    try {
      var writeStream = fs.createWriteStream(this.getFile());
      writeStream.write(obj);
      writeStream.end();
      return true;
    } catch (err) {
      throw err;
    }
  }
};
