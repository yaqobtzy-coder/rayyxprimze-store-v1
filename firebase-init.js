// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { 
    getDatabase, ref, get, set, update, push, remove, 
    onValue, query, orderByChild, equalTo, off 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const database = getDatabase(app);

window.db = database;
window.dbRef = ref;
window.dbGet = get;
window.dbSet = set;
window.dbUpdate = update;
window.dbPush = push;
window.dbRemove = remove;
window.dbOnValue = onValue;
window.dbOff = off;
window.dbQuery = query;
window.dbOrderByChild = orderByChild;
window.dbEqualTo = equalTo;

console.log("✅ Firebase initialized");