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
  this.storage = new ForaBotStorage();
  console.info(this.getTime() + 'ForaBotController : Instance created');
}

ForaBotController.prototype.getCurrentData = function getCurrentData() {
  if (this.currentBot instanceof ForaBot) {
    var __data = this.currentBot.getData();
    __data.storage = this.storage.getData();
    return __data;
  } else {
    return undefined;
  }
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
    } else {
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
    } else {
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
    this.reset();
    this.currentBot = bot;
    if ( Object.keys(this.currentBot.storage).length > 0 ) {
      this.storage.load( this.currentBot.storage );
    }
    console.info(this.getTime() + 'ForaBotController[load] : Bot successfully loaded');
  } else {
    throw new ForaBotError('ForaBotController[load] : Cannot load received bot, must be a valid ForaBot instance')
  }
};

ForaBotController.prototype.reset = function reset() {
  this.storage = new ForaBotStorage();
}

/* EXPERIMENTAL */
ForaBotController.prototype.go = function go( status ) {
  this.botStatus = 0;
  this.start(status);
}

ForaBotController.prototype.start = function start( status ) {
  if (this.botStatus === 0 && (status || this.currentBot.init) ) {
    console.info(this.getTime() + 'ForaBotController[start] : Starting bot...');
    this.trigger('start');
    if ( typeof(status) == 'string' ) {
      this.currentStatus = status;
    } else if ( typeof(this.currentBot.init) == 'string' ) {
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
    this.trigger('finish', this);
  } else if (this.currentStatus) {
    var __status = this.currentBot.status[ this.currentStatus ];
    var __message = this.extend( { id: Date.now() }, this.currentBot.status[ this.currentStatus ] );
    // Check for counter attribute
    if (__status && __status.counter) {
      var __actual = this.storage.getItem(__status.counter);
      if ( parseFloat(__actual) > 0 ) {
        this.storage.setItem(__status.counter, __actual+1);
      } else {
        this.storage.setItem(__status.counter, 1);
      }
    }
    // Check for UNSTORE action
    if ( __status && __status.unstore ) {
      this.storage.removeItem(__status.unstore);
    }
    if (__message.text) {
      __message.text = this.storage.replace(__message.text); // Replace stored values
    }
    this.botStatus = 1; // Running
    // Throw OUTPUT event
    console.info(this.getTime() + 'ForaBotController[checkCurrent] : Bot sends a message (' + this.currentStatus + ')');
    this.trigger('output',  __message );
    // Checking if an event must be thrown
    if ( __status && __status.event ) {
      this.trigger( 'custom.'+ __status.event, this);
    }
    this.next(); // Points to next status
  }
};

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
          this.trigger( 'custom.'+ __keyword.event, this);
        }
        // Setup next status
        this.next( __newCurrentStatus );
        return true;
      }
    }
    //
    // BUTTONS CHECK
    //
    if (__status.buttons && __status.buttons.length > 0) {
      for (var i=0; i<__status.buttons.length; i++){
        var __regexp = new RegExp(value, 'gi');
        var __button = __status.buttons[i];
        if ( __button.caption == value || __button.value == value ) {
          this.timeoutOverwrite = 0;
          // Throw INPUT event
          this.trigger('input', {
            currentStatus: this.currentStatus,
            nextStatus:  __button.next,
            text: value
          });
          // Check for UNSTORE action
          if ( __button.unstore ) {
            this.storage.removeItem(__button.unstore);
          }
          // Check for DECREASE action
          if ( __button.decrease ) {
            var __counter = this.storage.getItem(__button.decrease);
            if (typeof(__counter) == "number") {
              this.storage.setItem(__button.decrease, __counter-1);
            }
          }
          // Check for STORE action
          if ( __button.store ) {
            if (typeof(__button.store) == 'string') {
              var __value = __button.value || __button.caption;
              this.storage.setItem(__button.store, __value);
            }
          }
          // Check for FLAG action
          if ( __button.flag && __button.flag.length ) {
            if (typeof(__button.flag) == 'string') {
              this.storage.setItem(__button.flag, true);
            } else {
              for (var j=0; j<__button.flag.length; j++) {
                this.storage.setItem(__button.flag[i], true);
              }
            }
          }
          // Check for UNFLAG action
          if ( __button.unflag && __button.unflag.length ) {
            if (typeof(__button.unflag) == 'string') {
              this.storage.setItem(__button.unflag, false);
            } else {
              for (var j=0; j<__button.unflag.length; j++) {
                this.storage.setItem(__button.unflag[i], false);
              }
            }
          }
          // Checking if an event must be thrown
          if ( typeof(__button.event) == 'string' ) {
            this.trigger( 'custom.'+ __button.event, this);
          }
          // Points next status
          this.next( __button.next );
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
        text: value
      });
      if (__status.input.store) {
        this.storage.setItem(__status.input.store, value);
      }
      this.next( __status.input.next );
      return true;
    }
    //
    // CHECKLIST CHECK
    //
    if ( typeof(__status.checklist) == "object" ) {
      // TODO: Validation (email, name, phone, ...)
      this.trigger('input', {
        currentStatus: this.currentStatus,
        nextStatus: __status.checklist.next,
        text: value
      });
      if (__status.checklist.store) {
        this.storage.setItem(__status.checklist.store, value);
      }
      this.next( __status.checklist.next );
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
  var __currentStatus = this.currentBot.status[ this.currentStatus ];

  if ( typeof(__currentStatus) == 'undefined') {
    console.info(this.getTime() + 'ForaBotController[wait] : Bot is waiting but current status not valid (status=' + this.botStatus + ')');
  } else {
    console.info(this.getTime() + 'ForaBotController[wait] : Bot is waiting for a message (status=' + this.botStatus + ')');
  }

  if (__currentStatus && (__currentStatus.input || __currentStatus.checklist) ) {
    this.trigger('waiting', __currentStatus );
  }
}

ForaBotController.prototype.next = function next( value ) {
  var __status = this.currentBot.status[ this.currentStatus ];
  var __timeout = ( __status instanceof ForaBotStatus) ? __status.getReadTime() : 100;
  var __nextStatus;

  if ( typeof(value) != 'undefined' ) {
    //
    // Receive the next status
    //
    __nextStatus = value;
  } else if (this.currentStatus) {
    //
    // Check currentStatus to get next status
    //
    if ( __status instanceof ForaBotStatus) {
      if ( typeof(__status.next) == 'string' ) {
        // next keyword is a String
        __nextStatus = __status.next;
      } else if ( __status.next && __status.next.length ) {
        // next keyword is an Array
        if ( __status.next.length === 1 ) {
          __nextStatus = __status.next[0];
        } else {
          var __random = Math.floor(Math.random() * (__status.next.length));
          __nextStatus = __status.next[__random];
        }
      } else if ( __status.next === false) {
        __nextStatus = __status.next;
      }
    }
  }

  if (__nextStatus === false) {
    console.info(this.getTime() + 'ForaBotController[next] : Bot says goodbye!');
    this.trigger('finish', this);
  } else if ( typeof(__nextStatus) == 'string' ) {
    this.currentStatus = __nextStatus;
    // Typing delay
    var __timeout = (__status) ? __status.getReadTime() : 100;
    console.info(this.getTime() + 'ForaBotController[next] : Bot is typing (' + __timeout + ' ms)');
    this.trigger('typing', { timeout: __timeout } );
    this.timeout = setTimeout(this.checkCurrent.bind(this), __timeout);
  } else {
    this.wait();
  }
};
