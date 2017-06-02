/**
 * ForaBotJs - Custom storage class
 *
 * @constructor
 * @param {String} message - Error essage
 */
function ForaBotStorage() {
  this.storage = {};
}

ForaBotStorage.prototype.setItem = function setItem( key, value) {
  if (typeof(key) == "string") {
    this.storage[ key ] = value;
  } else {
    throw new ForaBotError('ForaBotStorage[setItem] : Storage key must be a valid String')
  }
}

ForaBotStorage.prototype.getItem = function getItem( key ) {
  return this.storage[ key ];
}

ForaBotStorage.prototype.removeItem = function removeItem( key ) {
  if (typeof(this.storage[ key ]) != "undefined") {
    delete this.storage[ key ];
    return true;
  } else {
    return false;
  }
}
