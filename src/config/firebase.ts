// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref} from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAj2ZhiQUATidxpcwGEIgjp_I_uDWxs-Qk",
  authDomain: "kanjapp2.firebaseapp.com",
  databaseURL: "https://kanjapp2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kanjapp2",
  storageBucket: "kanjapp2.appspot.com",
  messagingSenderId: "744137002416",
  appId: "1:744137002416:web:80329de24cbea30ee71a75",
  measurementId: "G-SD6W7L94K9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

//firestore
export const db = getFirestore(app);

//realtime database
export const database = getDatabase(app);


//export const kanjiRef = ref(database, "https://kanjapp2-default-rtdb.europe-west1.firebasedatabase.app/")