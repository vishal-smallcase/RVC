import * as firebase from 'firebase';

const config = {
    
};

firebase.initializeApp(config);
export const database = firebase.database();
export const dbRef = database.ref();
