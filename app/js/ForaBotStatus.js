/**
 * ForaBotJs - Represents a bot status
 *
 * @constructor
 * @param {String} id - Status ID
 * @param {Object} data - Status data
 */
function ForaBotStatus( id, data ) {
  var __idValidator = new RegExp('^[0-9a-zA-Z_-]+$','g');
  if ( typeof(id) === 'string' && __idValidator.test(id) ) {
    this.id = id;
    if ( typeof(data) === 'object' ) {
      this.type = data.type || null;
      this.text = data.text || null;
      this.next = data.next || [];
      this.images = data.images || [];
      this.buttons = data.buttons || [];
      this.download = data.download || null;
      this.code = data.code || null;
      this.link = data.link || null;
    } else {
      this.type = null;
      this.text = null;
      this.next = [];
      this.images = [];
      this.buttons = [];
      this.download = null;
      this.code = null;
      this.link = null;
    }
  } else {
    throw new ForaBotError('ForaBotStatus : Status ID must be a valid string')
  }
}

ForaBotStatus.prototype.getReadTime = function getReadTime( ) {
  var __time = localStorage.getItem('ForaBotStatus-' + this.id) || '0';
  __time = parseFloat( __time );
  if (__time === 0) {
    if ( this.text ) {
      __time += (this.text.split(/[\s\.\,\;\:]/).length / 350) * 60000;
    }
    if ( this.images ) {
      __time += this.images.length * 50;
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
    if ( this.images ) {
      __time += (this.buttons.length / 350) * 60000;
    }
    localStorage.setItem('ForaBotStatus-' + this.id, 10);
  }
  return __time;
};
