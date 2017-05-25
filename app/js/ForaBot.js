/**
 * ForaBotJs - Represents a bot
 *
 * @constructor
 * @param {String} id - Bot ID
 * @param {Object} data - Bot data
 */
function ForaBot( id, data ) {
  var __idRegExp = new RegExp('^[0-9a-zA-Z_-]+$','g');
  if ( typeof(id) === 'string' && __idRegExp.test(id) ) {
    this.id = id;
    this.status = {};
    if ( typeof(data) === 'object' ) {
      this.name = data.name || null;
      if ( typeof(data.status) === 'object' ) {
        for ( var __key in data.status ) {
          this.status[__key] = new ForaBotStatus( __key, data.status[__key] );
        }
      }
    } else {
      this.name = null;
      this.status = {};
    }
  } else {
    throw new ForaBotError('ForaBot : Bot ID must be a valid string')
  }
}
