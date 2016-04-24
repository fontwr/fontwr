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

  static get(property){
    var obj = this.toJson();
    return obj[property];
  }

  static getFontByName(name){
    var obj = this.toJson();
    if (obj.fonts.hasOwnProperty(name)) {
      return obj.fonts[name];
    } else if (obj.systemFonts.hasOwnProperty(name)){
      return obj.systemFonts[name];
    } else {
      return false;
    }
  }

  static getFontByFamily(name){
    var obj = this.toJson();
    var result = obj.fonts;
    for (var font in obj.fonts) {
      for (var key in obj.fonts[font]) {
        if (key.toString() == 'family' && obj.fonts[font][key] != name) {
          delete result[font];
        }
      }
    }
    return result;
  }

  static save(obj){
    try {
      var writeStream = fs.createWriteStream(this.getFile());
      writeStream.write(JSON.stringify(obj,null,'\t'));
      writeStream.end();
    } catch (err) {
      return err;
    }
  }

}
