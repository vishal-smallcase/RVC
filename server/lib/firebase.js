const firebase = require('firebase');

const config = {
  apiKey: "AIzaSyDH6saPzfMb1Yr0NpU2f_rbNXr48NDQKC8",
  authDomain: "kyc-demo-local.firebaseapp.com",
  databaseURL: "https://kyc-demo-local.firebaseio.com",
  projectId: "kyc-demo-local",
  storageBucket: "kyc-demo-local.appspot.com",
  messagingSenderId: "688336554043",
  appId: "1:688336554043:web:3440072261e2e58477741e"
};

const database = firebase.initializeApp(config).database();

module.database = database;

