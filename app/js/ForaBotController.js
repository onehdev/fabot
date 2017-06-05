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
    // KEYWORDS CHECK
    //
    var __keywordRegExp = new RegExp('^\#[0-9a-zA-Z_-]+');
    if ( __keywordRegExp.test(value) ) {
      console.info(this.getTime() + 'ForaBotController[send] : Checking keyword ('+ value +')');
      var __keyword = this.currentBot.keywords[ value.replace('#','') ];
      if ( __keyword instanceof ForaBotKeyword ) {
        console.info(this.getTime() + 'ForaBotController[send] : Found a valid keyword ('+ value + ')');
        var __newCurrentStatus;
        // Checking if next status is defined
        if ( typeof(__keyword.next) != 'undefined' ) {
          if ( __keyword.next === false || typeof(__keyword.next) == 'string' ) {
            // next keyword is a String
            __newCurrentStatus = __keyword.next;
          } else {
            // next keyword is an Array
            if ( __keyword.next.length === 1 ) {
              __newCurrentStatus = __keyword.next[0];
            } else {
              var __random = Math.floor(Math.random() * (__keyword.next.length));
              __newCurrentStatus = __keyword.next[__random];
            }
          }
        }
        // Checking if an event must be thrown
        if (__keyword.event) {
          this.trigger( 'custom.'+ __keyword.event, {
            currentStatus: this.currentStatus,
            nextStatus: __newCurrentStatus,
            valueReceived: value
          });
        }
        // Setup next status
        this.next( __newCurrentStatus );
        return true;
      }
    }
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
    if ( __status instanceof ForaBotStatus) {
      if ( __status.next == null || typeof(__status.next) == 'undefined' ) {
        this.wait();
      } else if ( __status.next === false ) {
        // next keyword is a False (END-OF-BOT)
        this.currentStatus = __status.next;
      } else if ( __status.next.length ) {
        if ( typeof(__status.next) == 'string' ) {
          // next keyword is a String
          this.currentStatus = __status.next;
        } else {
          // next keyword is an Array
          if ( __status.next.length === 1 ) {
            this.currentStatus = __status.next[0];
          } else {
            var __random = Math.floor(Math.random() * (__status.next.length));
            this.currentStatus = __status.next[__random];
          }
        }
        // Typing delay
        var __timeout = (__status) ? __status.getReadTime() : 500;
        console.info(this.getTime() + 'ForaBotController[next] : Bot is typing (' + __timeout + ' ms)');
        this.trigger('typing', { timeout: __timeout } );
        this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
      } else {
        this.wait();
      }
    } else {
      throw new ForaBotError('ForaBotController[next] : Incorrect status keyword (' + this.currentStatus + ')');
    }
  }
};
