const firebase = require('firebase');

const config = {
  
};

const database = firebase.initializeApp(config).database();

module.database = database;

