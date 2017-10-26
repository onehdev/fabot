/**
 * ForaBotJs - Custom storage class
 *
 * @constructor
 * @param {String} message - Error essage
 */
function ForaBotStorage() {
  this.storage = {};
  this.insideRegExp = new RegExp('~([a-zA-Z0-9_\]+)~','g');
  this.outsideRegExp = new RegExp('\\$([a-zA-Z0-9_\~]+)','g');
}

ForaBotStorage.prototype.getData = function getData() {
  var __data = {};
  for (var __key in this.storage){
    __data[__key] = this.storage[__key];
  }
  return __data;
}

ForaBotStorage.prototype.setItem = function setItem( key, value) {
  if (typeof(key) == "string") {
    this.storage[ this.replace(key, true) ] = value;
  } else {
    throw new ForaBotError('ForaBotStorage[setItem] : Storage key must be a valid String')
  }
}

ForaBotStorage.prototype.load = function load( data ) {
  if ( typeof(data) == 'object') {
    for (var key in data) {
      this.setItem(key, data[key]);
    }
  } else {
    throw new ForaBotError('ForaBotStorage[load] : Storage data must be a valid JSON')
  }
}

ForaBotStorage.prototype.getItem = function getItem( key ) {
  return this.storage[ this.replace(key, true) ];
}

ForaBotStorage.prototype.removeItem = function removeItem( key ) {
  if ( this.outsideRegExp.test(key) ) {
    if (typeof(this.storage[ this.replace(key, true) ]) != "undefined") {
      delete this.storage[ this.replace(key, true) ];
      return true;
    } else {
      return false;
    }
  } else {
    // RegExp
    var __customRegExp = new RegExp(this.replace(key, true), 'g');
    var __keysToDelete = [];
    for (var __key in this.storage) {
      if ( __customRegExp.test( __key ) ) {
        __keysToDelete.push(__key);
      }
    }
    if (__keysToDelete.length > 0) {
      for (var i=0; i<__keysToDelete.length; i++){
        delete this.storage[ __keysToDelete[i] ];
      }
      return true;
    } else {
      return false;
    }
  }
}

ForaBotStorage.prototype.replace = function replace( value, inside){
  var __regexp = (inside === true) ? this.insideRegExp : this.outsideRegExp
  if (typeof(value) == 'string') {
    var __matches = value.match(__regexp);
    if (__matches) {
      for (var i=0; i<__matches.length; i++){
        var __match = __matches[i].replace(__regexp, '$1');
        var __storedValue = this.getItem(__match) || '';
        value = value.replace(__matches[i], __storedValue, 'g');
      }
    }
  }
  return value;
}
