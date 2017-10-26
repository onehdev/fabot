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
    this.init = undefined;
    this.name = undefined;
    this.autotypingTimeout = 0;
    this.status = {};
    this.keywords = {};
    this.storage = {};
    if ( typeof(data) === 'object' ) {
      this.name = data.name || undefined;
      this.init = data.init || undefined;
      this.autotypingTimeout = (typeof(data.autotypingTimeout) == 'number') ? data.autotypingTimeout : 0;
      if ( typeof(data.status) === 'object' ) {
        for ( var __key in data.status ) {
          this.status[__key] = new ForaBotStatus( __key, data.status[__key], this);
        }
      }
      if ( typeof(data.keywords) === 'object' ) {
        for ( var __key in data.keywords ) {
          this.keywords[__key] = new ForaBotKeyword( __key, data.keywords[__key], this);
        }
      }
      if ( typeof(data.storage) === 'object' ) {
        for ( var __key in data.storage ) {
          this.storage[__key] = data.storage[__key];
        }
      }
    }
  } else {
    throw new ForaBotError('ForaBot : Bot ID must be a valid string')
  }
}

ForaBot.prototype.getData = function getData() {
  var __data = {
    id: this.id,
    init: this.init,
    name: this.name,
    autotypingTimeout: this.autotypingTimeout,
    status: {},
    keywords: {},
    storage: {}
  };
  for (var __key in __data){
    if (__data[__key] == null || __data[__key] == undefined) {
      delete __data[__key];
    }
  }
  // STATUS LOAD
  for ( var __key in this.status ) {
    __data.status[__key] = this.status[__key].getData();
  }
  // KEYWORDS LOAD
  for ( var __key in this.keywords ) {
    __data.keywords[__key] = this.keywords[__key].getData();
  }
  // STORAGE LOAD
  for ( var __key in this.storage ) {
    __data.storage[__key] = this.storage[__key];
  }
  return __data;
}
