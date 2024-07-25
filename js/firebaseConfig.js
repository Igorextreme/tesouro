// firebaseconfig.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyCB4R_ixloHBJSvVJEr69fPqnzEhdZjvVw",
    authDomain: "tesouro-1777a.firebaseapp.com",
    databaseURL: "https://tesouro-1777a-default-rtdb.firebaseio.com",
    projectId: "tesouro-1777a",
    storageBucket: "tesouro-1777a.appspot.com",
    messagingSenderId: "454369768010",
    appId: "1:454369768010:web:80b30f52686f7a8a19acb3",
    measurementId: "G-B5NQSMHK33"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider };
