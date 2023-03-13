import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useEffect } from "react";

import { Provider } from 'react-redux';
import { store } from "./store/store";

import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, provider, db } from "./config/firebase";



interface Kanji {
  character?: string;
  meanings?: string[];
  freq?: number;
  grade?: number;
  jlpt_new?: number;
  jlpt_old?: number;
  category?: string;
  strokes?: number;
  
}




const saveDataBeforeUnload = () => {
  const storedKanji = JSON.parse(sessionStorage.getItem("learnedKanjiArray") || "[]") as Kanji[];
  storedKanji.forEach((kanji: Kanji) => {
    handleSaveKanji(kanji);
  });   
};

const handleSaveKanji = async (kanji: Kanji) => {
  const currentUser = auth.currentUser?.uid;
  if (currentUser) {
    const learnedRef = collection(db, "users", currentUser, "learned");
    const docRef = doc(learnedRef, kanji.character);
    await setDoc(docRef, { kanji });
  }  
};

useEffect(() => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    saveDataBeforeUnload();
    event.preventDefault();
    event.returnValue = '';
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);







const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);