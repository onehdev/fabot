/**
 * ForaBotJs - Represents a bot keyword
 *
 * @constructor
 * @param {String} id - Status ID
 * @param {Object} data - Status data
 * @param {ForaBot} bot - Super reference
 */
function ForaBotKeyword( id, data, bot ) {
  var __idValidator = new RegExp('^[0-9a-zA-Z_-]+$','g');
  if ( typeof(id) === 'string' && __idValidator.test(id) ) {
    this.id = id;
    this.super = bot;
    if ( typeof(data) === 'object' ) {
      for(var __key in data) {
        this[__key] = data[__key];
      }
      this.event = data.event || null;
      this.next = (data.next || data.next === false) ? data.next : null;
    } else {
      this.event = null;
      this.next = null;
    }
  } else {
    throw new ForaBotError('ForaBotKeyword : Keyword ID must be a valid string')
  }
}

ForaBotKeyword.prototype.getData = function getData() {
  var __data = {
    event: this.event,
    next: this.next,
  };
  for (var __key in __data){
    if (__data[__key] == null || __data[__key] == undefined) {
      delete __data[__key];
    }
  }
  return __data;
}
