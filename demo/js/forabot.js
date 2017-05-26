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

/**
 * ForaBotJs - Main controller
 *
 * @constructor
 * @param {Function} externalReceiver - Function that will be called when ForaBot sends a message
 */
function ForaBotController( externalReceiver, endCallback ) {
  this.botStatus = 0;
  this.timeout = null;
  this.timeoutOverwrite = 0;
  this.currentStatus = null;
  this.chatBox = null;
  this.externalReceiver = externalReceiver;
  this.currentBot = null;
  this.endCallback = ( typeof(endCallback) == 'function' ) ? endCallback : null ;
}

/**
 * Loads given bot
 * @param  {ForaBot} bot
 */
ForaBotController.prototype.load = function load( bot ) {
  if (bot instanceof ForaBot) {
    this.currentBot = bot;
  } else {
    throw new ForaBotError('ForaBotController.load : Cannot load received bot, must be a valid ForaBot instance')
  }
};

/**
 * Starts the chatbot
 */
ForaBotController.prototype.start = function start() {
  if (this.botStatus === 0) { // Off
    this.currentStatus = 'init';
    this.botStatus = 1; // Running
    var __status = this.currentBot.status[ this.currentStatus ];
    if ( __status ) {
      //var __timeout = this.timeoutOverwrite || __status.timeout || Math.round(Math.random() * (1000 - 300)) + 300;
      var __timeout = (__status) ? __status.getReadTime() : 1;
      this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
    }
  }
};

/**
 * Extends the defaults object with the properties of the overwrites object
 * @param {Object} defaults JS object with default values
 * @param {Object} overwrites JS object with new values
 * @return {Object} Returns de "defaults" object with the new properties
 */
ForaBotController.prototype.extend = function extend(defaults, overwrites){
  for(var __key in overwrites) {
    if( overwrites.hasOwnProperty(__key) ) {
      defaults[__key] = overwrites[__key];
    }
  }
  return defaults;
}

/**
 * Checks the current bot status
 */
ForaBotController.prototype.checkCurrent = function checkCurrent() {
  if (this.currentStatus === false ) {
    if ( this.endCallback ) this.endCallback();
  } else if (this.currentStatus) {
    var __status = this.currentBot.status[ this.currentStatus ];
    if ( __status.type == 'put' ) {
      this.botStatus = 1; // Running
      var __message = this.extend( { id: Date.now() }, this.currentBot.status[ this.currentStatus ] );
      this.externalReceiver( __message );
    } else if ( __status.type == 'options' ) {
      this.botStatus = 2; // Waiting
      var __message = this.extend( { id: Date.now() }, this.currentBot.status[ this.currentStatus ] );
      this.externalReceiver( __message );
    }
    this.next();
  }
};

/**
 * Stops the chatbot
 */
ForaBotController.prototype.stop = function stop() {
  console.log('Stop')
  if (this.timeout) clearTimeout( this.timeout );
  this.timeout = null;
  this.status = 9;
  this.timeoutOverwrite = 0;
  this.chatBox = riot.mount('chat-box', {messages: window.messages}  );
};

// ForaBotController.prototype.checkResponse = function checkResponse( response ) {
//   this.timeoutOverwrite = 10;
//   var __status = this.bot[ this.currentStatus ];
//   if (__status.buttons) {
//     for (var i=0; i<__status.buttons.length; i++){
//       var __regexp = new RegExp(__status.buttons[i].text, 'gi');
//       if ( __regexp.test(response) ) {
//         this.timeoutOverwrite = 0;
//         this.next( __status.buttons[i].next );
//         return true;
//       }
//     }
//   }
//   return false;
// }

/**
 * Sends a response to the chatbot
 * @param {String} value
 * @return {Boolean} True if processed
 */
ForaBotController.prototype.send = function send( value ) {
  if (this.botStatus == 2) { // Waiting
    this.timeoutOverwrite = 10;
    var __status = this.currentBot.status[ this.currentStatus ];
    if (__status.buttons.length > 0) {
      for (var i=0; i<__status.buttons.length; i++){
        var __regexp = new RegExp(__status.buttons[i].text, 'gi');
        if ( __regexp.test(value) ) {
          this.timeoutOverwrite = 0;
          this.next( __status.buttons[i].next );
          return true;
        }
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/**
 * Goes to the next chatbot status
 * @param {String} value (optional) the next status
 */
ForaBotController.prototype.next = function next( value ) {
  if (this.chatBox) this.chatBox[0].unmount(true);
  if ( typeof(value) != 'undefined' ) {
    var __status = this.currentBot.status[ this.currentStatus ];
    //var __timeout = this.timeoutOverwrite || __status.timeout || Math.round(Math.random() * (1000 - 300)) + 300;
    var __timeout = (__status) ? __status.getReadTime() : 50;
    // Received a new status
    this.currentStatus = value;
    this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
  } else if (this.currentStatus) {
    var __status = this.currentBot.status[ this.currentStatus ];
    if ( typeof(__status.next) == 'undefined' || __status.next.length === undefined || __status.next.length === 0 ) {
      //this.stop();
    } else {
      if ( __status.next.length === 1 ) {
        this.currentStatus = __status.next[0];
      } else {
        var __random = Math.floor(Math.random() * (__status.next.length));
        this.currentStatus = __status.next[__random];
      }
      //var __timeout = this.timeoutOverwrite || __status.timeout || Math.round(Math.random() * (1000 - 300)) + 300;
      var __timeout = (__status) ? __status.getReadTime() : 50;
      this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
    }
  }
};

/**
 * ForaBotJs - Custom error class
 *
 * @constructor
 * @param {String} message - Error essage
 */
function ForaBotError( message ) {
  this.name = 'ForaBotError';
  this.message = message || "An error occurred :(";
}

ForaBotError.prototype = new Error();
ForaBotError.prototype.constructor = ForaBotError;

/**
 * ForaBotJs - Represents a chatbot status
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

/**
 * Calculates the read time of a message
 * @return {Number} Time in ms
 */
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

//# sourceMappingURL=forabot.js.map
