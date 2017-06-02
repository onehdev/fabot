// MIT License
//
// Copyright (c) 2017 Osama Nehme (onehdev@gmail.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * ForaBotJs - Represents a bot
 *
 * @constructor
 * @param {String} id Bot ID
 * @param {Object} data Bot data
 */
function ForaBot( id, data ) {
  var __idValidator = new RegExp('^[0-9a-zA-Z_-]+$','g');
  if ( typeof(id) === 'string' && __idValidator.test(id) ) {
    this.id = id;
    this.init = null;
    this.status = {};
    if ( typeof(data) === 'object' ) {
      this.name = data.name || null;
      this.init = data.init || null;
      this.autotypingTimeout = (typeof(data.autotypingTimeout) == 'number') ? data.autotypingTimeout : 0;
      if ( typeof(data.status) === 'object' ) {
        for ( var __key in data.status ) {
          this.status[__key] = new ForaBotStatus( __key, data.status[__key], this);
        }
      }
    } else {
      this.name = null;
      this.init = null;
      this.autotypingTimeout = 0;
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
 */
function ForaBotController() {
  this.botStatus = 0;
  this.timeout = null;
  this.timeoutOverwrite = 0;
  this.currentStatus = null;
  this.listeners = {};
  this.currentBot = null;
  this.storage = null;
  console.info(this.getTime() + 'ForaBotController : Instance created');
}

/**
 * Attach an event handler function for one event
 * @param {String} eventType - Event type (can be multiple events separated by spaces)
 * @param {Function} callbackFn - Callback
 */
ForaBotController.prototype.on = function on(eventType, callbackFn) {
  var self = this;
  var __setListener = function(eventType, callbackFn) {
    var listeners = self.listeners[ eventType ];
    if ( typeof(listeners) != 'undefined' ){
      if ( listeners.indexOf(callbackFn) == -1 ) {
        listeners.push( callbackFn );
      }
    } else {
      self.listeners[ eventType ] = [ callbackFn ];
    }
  }
  if ( typeof(eventType) == 'string' ) {
    var __splited = eventType.split(' ');
    if (__splited.length === 1) {
      __setListener(eventType, callbackFn);
    } else {
      for (var i=0; i<__splited.length; i++) {
        __setListener(__splited[i], callbackFn);
      }
    }
  }
};

/**
 * Dettach an event handler function for one event type
 * If no callbackFn specified will dettach all event's handlers
 * @param {String} eventType - Event type (can be multiple events separated by spaces)
 * @param {Function} callbackFn - Callback (optional)
 */
ForaBotController.prototype.off = function off(eventType, callbackFn) {
  var self = this;
  var __clearListener = function(eventType, callbackFn) {
    var listeners = self.listeners[ eventType ];
  	if ( typeof(listeners) != 'undefined' ){
      if (callbackFn) {
        var index = listeners.indexOf(callbackFn);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      } else {
        delete self.listeners[ eventType ];
      }
    }
  }
  if ( typeof(eventType) == 'string' ) {
    var __splited = eventType.split(' ');
    if (__splited.length === 1) {
      __clearListener(eventType, callbackFn);
    } else {
      for (var i=0; i<__splited.length; i++) {
        __clearListener(__splited[i], callbackFn);
      }
    }
  }
};

/**
 * Execute all handlers attached to an eventType
 * @param {String} eventType - Event type
 * @param {Object} data - Event data
 */
ForaBotController.prototype.trigger = function trigger(eventType, data) {
  var listeners = this.listeners[ eventType ];
  if ( typeof(listeners) != 'undefined' ){
    for (var i=0; i<listeners.length; i++) {
      if ( typeof(listeners[i]) == "function" ) listeners[i]( data );
    }
  }
};

ForaBotController.prototype.load = function load( bot ) {
  if (bot instanceof ForaBot) {
    this.currentBot = bot;
    console.info(this.getTime() + 'ForaBotController[load] : Bot successfully loaded');
  } else {
    throw new ForaBotError('ForaBotController[load] : Cannot load received bot, must be a valid ForaBot instance')
  }
};

ForaBotController.prototype.reset = function reset() {
  this.storage = new ForaBotStorage();
}

ForaBotController.prototype.start = function start() {
  if (this.botStatus === 0 && this.currentBot.init) {
    console.info(this.getTime() + 'ForaBotController[start] : Starting bot...');
    this.reset();
    if ( typeof(this.currentBot.init) == 'string' ) {
      this.currentStatus = this.currentBot.init;
    } else if ( this.currentBot.init.length ) {
      var __random = Math.floor(Math.random() * (this.currentBot.init.length));
      this.currentStatus = this.currentBot.init[__random];
    } else {
      throw new ForaBotError('ForaBotController[start] : Bot\'s initial status error, must be String or String[]!')
    }
    this.botStatus = 1; // Running
    var __status = this.currentBot.status[ this.currentStatus ];
    if ( __status ) {
      var __timeout = 500;
      console.info(this.getTime() + 'ForaBotController[start] : Bot is typing (' + __timeout + ' ms)');
      this.trigger('typing', { timeout: __timeout } );
      this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
    } else {
      throw new ForaBotError('ForaBotController[start] : Bot\'s initial status error, "' + this.currentStatus + '" doesn\'t exist!');
    }
  } else {
    console.info(this.getTime() + 'ForaBotController[start] : No initial status defined');
  }
};

ForaBotController.prototype.extend = function extend(defaults, overwrites){
  for(var __key in overwrites) {
    if( overwrites.hasOwnProperty(__key) ) {
      defaults[__key] = overwrites[__key];
    }
  }
  return defaults;
}

ForaBotController.prototype.checkCurrent = function checkCurrent() {
  if (this.currentStatus === false ) {
    console.info(this.getTime() + 'ForaBotController[checkCurrent] : Bot says goodbye!');
    this.trigger('finish');
  } else if (this.currentStatus) {
    var __status = this.currentBot.status[ this.currentStatus ];
    var __message = this.extend( { id: Date.now() }, this.currentBot.status[ this.currentStatus ] );
    this.replaceStored(__message);
    this.botStatus = 1; // Running
    console.info(this.getTime() + 'ForaBotController[checkCurrent] : Bot sends a message (' + this.currentStatus + ')');
    this.trigger('output',  __message );
    this.next();
  }
};

ForaBotController.prototype.replaceStored = function replaceStored( message ){
  if (typeof(message.text) == 'string') {
    var __storageRegExp = new RegExp('~([a-zA-Z0-9_]+)~','g');
    var __matches = message.text.match(__storageRegExp);
    if (__matches) {
      for (var i=0; i<__matches.length; i++){
        var __match = __matches[i].replace(__storageRegExp, '$1');
        var __storedValue = this.storage.getItem(__match);
        if (__storedValue) {
          message.text = message.text.replace(__matches[i], __storedValue, 'g');
        }
      }
    }
  }
}

ForaBotController.prototype.getTime = function getTime(){
  var __date = new Date();
  var __hours = (__date.getHours() < 10) ? '0' + __date.getHours() : __date.getHours();
  var __minutes = (__date.getMinutes() < 10) ? '0' + __date.getMinutes() : __date.getMinutes();
  var __seconds = (__date.getSeconds() < 10) ? '0' + __date.getSeconds() : __date.getSeconds();
  return '[' + __hours + ':' + __minutes + ':' + __seconds + '] ';
}

ForaBotController.prototype.stop = function stop() {
  console.info(this.getTime() + 'ForaBotController[stop] : Stopping bot...');
  if (this.timeout) clearTimeout( this.timeout );
  this.timeout = null;
  this.status = 9;
  this.timeoutOverwrite = 0;
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

ForaBotController.prototype.send = function send( value ) {
  console.info(this.getTime() + 'ForaBotController[send] : Bot receives a message (' + value + ')');
  if (typeof(value) != 'string') {
    throw new ForaBotError('ForaBotController[send] : Received message isn\'t a valid String');
  }
  if (this.botStatus == 2) { // Waiting
    console.info(this.getTime() + 'ForaBotController[send] : Processing message...');
    this.timeoutOverwrite = 10;
    var __status = this.currentBot.status[ this.currentStatus ];
    //
    // BUTTONS CHECK
    //
    if (__status.buttons.length > 0) {
      for (var i=0; i<__status.buttons.length; i++){
        var __regexp = new RegExp(value, 'gi');
        if ( __regexp.test(__status.buttons[i].caption) ) {
          this.timeoutOverwrite = 0;
          this.trigger('input', {
            currentStatus: this.currentStatus,
            nextStatus:  __status.buttons[i].next,
            valueReceived: value
          });
          this.next( __status.buttons[i].next );
          return true;
        }
      }
    }
    //
    // INPUT CHECK
    //
    if ( typeof(__status.input) == "object" ) {
      // TODO: Validation (email, name, phone, ...)
      this.trigger('input', {
        currentStatus: this.currentStatus,
        nextStatus: __status.input.next,
        valueReceived: value
      });
      this.storage.setItem(__status.input.store, value);
      this.next( __status.input.next );
      return true;
    }
    console.info(this.getTime() + 'ForaBotController[send] : Received message doesn\'t match any path');
    return false;
  } else {
    console.info(this.getTime() + 'ForaBotController[send] : Bot isn\'t waiting for a message (status=' + this.botStatus + ')');
    return false;
  }
};

ForaBotController.prototype.wait = function wait() {
  this.botStatus = 2; // Waiting
  console.info(this.getTime() + 'ForaBotController[wait] : Bot is waiting for a message (status=' + this.botStatus + ')');
  this.trigger('waiting', this.currentBot.status[ this.currentStatus ] );
}

ForaBotController.prototype.next = function next( value ) {
  if ( typeof(value) != 'undefined' ) { // Received a new status
    var __status = this.currentBot.status[ this.currentStatus ];
    var __timeout = (__status) ? __status.getReadTime() : 500;
    console.info(this.getTime() + 'ForaBotController[next] : Bot is typing (' + __timeout + ' ms)');
    this.trigger('typing', { timeout: __timeout } );
    this.currentStatus = value;
    this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
  } else if (this.currentStatus) {
    var __status = this.currentBot.status[ this.currentStatus ];
    if ( typeof(__status.next) == 'undefined' || __status.next.length === undefined || __status.next.length === 0 ) {
      this.wait();
    } else {
      if ( __status.next.length === 1 ) {
        this.currentStatus = __status.next[0];
      } else {
        var __random = Math.floor(Math.random() * (__status.next.length));
        this.currentStatus = __status.next[__random];
      }
      var __timeout = (__status) ? __status.getReadTime() : 500;
      console.info(this.getTime() + 'ForaBotController[next] : Bot is typing (' + __timeout + ' ms)');
      this.trigger('typing', { timeout: __timeout } );
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
 * ForaBotJs - Represents a bot status
 *
 * @constructor
 * @param {String} id - Status ID
 * @param {Object} data - Status data
 */
function ForaBotStatus( id, data, bot ) {
  var __idValidator = new RegExp('^[0-9a-zA-Z_-]+$','g');
  if ( typeof(id) === 'string' && __idValidator.test(id) ) {
    this.id = id;
    this.super = bot;
    if ( typeof(data) === 'object' ) {
      for(var __key in data) {
        this[__key] = data[__key];
      }
      this.text = data.text || null;
      this.next = data.next || [];
      this.images = data.images || null;
      this.buttons = data.buttons || [];
      this.download = data.download || null;
      this.code = data.code || null;
      this.link = data.link || null;
    } else {
      this.text = null;
      this.next = [];
      this.images = null;
      this.buttons = [];
      this.download = null;
      this.code = null;
      this.link = null;
    }
  } else {
    throw new ForaBotError('ForaBotStatus : Status ID must be a valid string')
  }
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

//# sourceMappingURL=forabot.js.map
