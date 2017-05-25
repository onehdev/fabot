/**
 * ForaBotJs - Main controller
 *
 * @constructor
 * @param {Function} externalReceiver - Function that will be called when a bot sends a message
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

ForaBotController.prototype.load = function load( bot ) {
  if (bot instanceof ForaBot) {
    this.currentBot = bot;
  } else {
    throw new ForaBotError('ForaBotController.load : Cannot load received bot, must be a valid ForaBot instance')
  }
};

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
