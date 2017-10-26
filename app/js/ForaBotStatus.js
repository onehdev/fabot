/**
 * ForaBotJs - Represents a bot status
 *
 * @constructor
 * @param {String} id - Status ID
 * @param {Object} data - Status data
 * @param {ForaBot} bot - Super reference
 */
function ForaBotStatus( id, data, bot ) {
  var __idValidator = new RegExp('^[0-9a-zA-Z_-]+$','g');
  if ( typeof(id) === 'string' && __idValidator.test(id) ) {
    this.id = id;
    this.super = bot;
    this.text = undefined;
    this.next = undefined;
    this.images = undefined;
    this.buttons = undefined;
    this.download = undefined;
    this.code = undefined;
    this.link = undefined;
    this.input = undefined;
    this.checklist = undefined;
    if ( typeof(data) === 'object' ) {
      for(var __key in data) {
        this[__key] = data[__key];
      }
      this.next = (data.next || data.next === false) ? data.next : null;
    }
  } else {
    throw new ForaBotError('ForaBotStatus : Status ID must be a valid string')
  }
}

ForaBotStatus.prototype.getData = function getData() {
  var __data = {
    text: this.text,
    next: this.next,
    input: this.input,
    checklist: this.checklist,
    images: this.images,
    buttons: this.buttons,
    download: this.download,
    code: this.code,
    link: this.link
  };
  for (var __key in __data){
    if (__data[__key] == null || __data[__key] == undefined) {
      delete __data[__key];
    }
  }
  return __data;
}

ForaBotStatus.prototype.getReadTime = function getReadTime() {
  var __time = 0;
  if (this.super.autotypingTimeout) {
    var __lastTime = localStorage.getItem('ForaBotStatus-' + this.super.id + '-' + this.id);
    var __actualTime = Date.now();
    if (__lastTime && (__actualTime - __lastTime < this.super.autotypingTimeout) ) {
      __time = 50; // If message already loaded in last minute... no delay
    }
  }
  if (__time === 0) {
    if ( this.text ) {
      __time += (this.text.split(/[\s\.\,\;\:]/).length / 350) * 60000;
    }
    if ( this.image ) {
      if ( typeof(this.image) == 'string' ) {
        __time += 500;
      } else {
        __time += this.image.length * 500;
      }
    }
    if ( this.download ) {
      __time += 50;
    }
    if ( this.link ) {
      __time += 50;
    }
    if ( this.code ) {
      __time += (this.text.split(/[\s\.\,\;\:]/).length / 350 / 2) * 60000;
    }
    if ( this.buttons ) {
      __time += (this.buttons.length / 350) * 60000;
    }
  }
  if (this.super.autotypingTimeout) {
    localStorage.setItem('ForaBotStatus-' + this.super.id + '-' + this.id, Date.now());
  }
  return Math.floor(__time);
};
