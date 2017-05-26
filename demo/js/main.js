"use strict";

window.messages = []; // List of messages shown

function messageReceived(message) {
	window.messages.push(message);
	riot.update();
}

function botFinished() {
	alert('Hemos terminado!')
}

var bot = new ForaBot('0', {
  name: 'Example',
  status: {
    init: {
      next: ["welcome_1","welcome_2"],
      timeout: 50,
    },
    //
    // Welcome
    //
    "welcome_1": {
      type: "put",
      text: "Hey! ForaBot is here 👋🏻",
      next: ["welcome_menu_title"],
    },
    "welcome_2": {
      type: "put",
      text: "Hola! Welcome to ForaBot project 👋🏻",
      next: ["welcome_menu_title"],
    },
    "welcome_menu_title": {
      type: "put",
      text: "What can I do for you?",
      next: ["welcome_menu"],
    },
    "welcome_back": {
      type: "put",
      text: "Can I help you with something else?",
      next: ["welcome_menu"],
    },
    "welcome_menu": {
      type: "options",
      buttons: [
        { text: 'About me', next: "about" },
        { text: 'Requirements', next: "requirements" },
        { text: 'Download', next: "download" },
        { text: 'Features', next: "features" },
        // { text: 'Download', next: false },
        // { text: 'Support', next: false },
        // { text: 'Donate', next: false },
      ],
    },
    //
    // About
    //
    "about": {
      type: "put",
      text: "Not much to say...",
      next: ["about_2"],
    },
    "about_2": {
      type: "put",
      text: "Check the project page on GitHub",
      link: { href: "https://github.com/onehdev/forabot", text: "https://github.com/onehdev/forabot", title: "Fork me on GitHub" },
      next: ["welcome_back"],
    },
    //
    // Requirements
    //
    "requirements": {
      type: "put",
      text: "You only need a Web browser and a text editor to create the chatbot",
      next: ["requirements_end"],
    },
    "requirements_end": {
      type: "put",
      text: "If need more info check this link:",
      link: { href: "https://github.com/onehdev/forabot", text: "ForaBot Wiki", title: "ForaBot Wiki section" },
      next: [ "welcome_back" ],
    },

    //
    // Download
    //
    "download": {
      type: "put",
      text: "Ok, here you have the JS file:",
      link: { href: "js/forabot.js", text: "forabot.js", title: "ForaBotJs" },
      next: [ "welcome_back" ],
    },
    //
    // Download
    //
    "features": {
      type: "put",
      text: "Well, let's see...",
      next: [ "features_text" ],
    },
    "features_text": {
      type: "put",
      text: "You can use ForaBot to send text messages like this one!",
      next: [ "features_image_1" ],
    },
    "features_image_1": {
      type: "put",
      text: "Also ForaBot can send images like this...",
      images: ["img/pipboy.png"],
      next: [ "features_image_2" ],
    },
    "features_image_2": {
      type: "put",
      text: "Or this one...",
      images: ["img/partyparrot.gif"],
      next: [ "welcome_back" ],
    },
  }
});

function runDemo() {
  window.jsbot = new ForaBotController( messageReceived, botFinished );
  window.jsbot.load( bot );
  window.jsbot.start();
  riot.mount('message-list', {messages: window.messages} );
};
