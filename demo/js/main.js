"use strict";

window.messages = []; // List of messages shown

function messageReceived(message) {
	window.messages.push(message);
	riot.update();
}

function messageSent(data) {

}

function botFinished() {

}

function botIsWaiting(status) {
  riot.mount('chat-box', {messages: window.messages} );
}

var bot = new ForaBot('0', {
  name: 'Example',
  init: 'welcome',
  autotypingTimeout: 30000,
  keywords: {
    "exit": {
      event: "exit",
      next: false,
    },
    "menu": {
      next: "welcome_menu",
    }
  },
  status: {
    //
    // Welcome
    //
    "welcome": {
      text: "Hey! ForaBot is here 👋🏻",
      next: "wellcome_get_name",
    },
    "wellcome_get_name": {
      text: "What\'s your name?",
      input: {
        store: "name",
        next: "welcome_hello"
      },
    },
    "welcome_hello": {
      text: "Hello ~name~, what can I do for you?",
      next: "welcome_menu",
    },
    "welcome_back": {
      text: "Can I help you with something else ~name~?",
      next: "welcome_menu",
    },
    "welcome_menu": {
      type: "options",
      buttons: [
        { caption: 'About me', next: "about" },
        { caption: 'Requirements', next: "requirements" },
        { caption: 'Download', next: "download" },
        { caption: 'Features', next: "features" },
        // { caption: 'Download', next: false },
        // { caption: 'Support', next: false },
        // { caption: 'Donate', next: false },
      ],
    },
    //
    // About
    //
    "about": {
      text: "Not much to say...",
      next: "about_2",
    },
    "about_2": {
      text: "Check the project page on GitHub",
      link: { href: "https://github.com/onehdev/forabot", text: "https://github.com/onehdev/forabot", title: "Fork me on GitHub" },
      next: "welcome_back",
    },
    //
    // Requirements
    //
    "requirements": {
      text: "You only need a Web browser and a text editor to create the chatbot",
      next: "requirements_end",
    },
    "requirements_end": {
      text: "If need more info check this link:",
      link: { href: "https://github.com/onehdev/forabot", text: "ForaBot Wiki", title: "ForaBot Wiki section" },
      next:  "welcome_back" ,
    },

    //
    // Download
    //
    "download": {
      text: "Ok, here you have the JS file:",
      link: { href: "js/forabot.js", text: "forabot.js", title: "ForaBotJs" },
      next:  "welcome_back" ,
    },
    //
    // Download
    //
    "features": {
      text: "Well, let's see...",
      next:  "features_text" ,
    },
    "features_text": {
      text: "You can use ForaBot to send text messages like this one!",
      next:  "features_image_1" ,
    },
    "features_image_1": {
      text: "Also ForaBot can send images like this...",
      images: ["img/pipboy.png"],
      next:  "features_image_2" ,
    },
    "features_image_2": {
      text: "Or this one...",
      images: ["img/partyparrot.gif"],
      next:  "welcome_back" ,
    },
  }
});

function runDemo() {
  window.jsbot = new ForaBotController();
  window.jsbot.on('output', messageReceived);
  window.jsbot.on('finish', botFinished);
  window.jsbot.on('input', messageSent);
  window.jsbot.on('waiting', botIsWaiting);
  window.jsbot.load( bot );
  window.jsbot.start();
  riot.mount('message-list', {messages: window.messages} );
};
