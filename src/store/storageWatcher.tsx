import React, { useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { doc, setDoc, collection } from "firebase/firestore";

const storageWatcher = () => {
  
  useEffect(() => {
    const saveDataBeforeUnload = (event: BeforeUnloadEvent) => {
      const storedKanji = JSON.parse(sessionStorage.getItem("learnedKanjiArray") || "[]") as Kanji[];
      storedKanji.forEach((kanji: Kanji) => {
        handleSaveKanji(kanji);
      });
      console.log("ťuky ťuk ahojky kluci");
      
    };

    window.addEventListener("beforeunload", saveDataBeforeUnload);

    return () => {
      
    window.removeEventListener("beforeunload", saveDataBeforeUnload);
    
    };
  }, []);

  const handleSaveKanji = async (kanji: Kanji) => {
    const currentUser = auth.currentUser?.uid;
    const learnedRef = collection(db, "users", currentUser, "learned");
    const docRef = doc(learnedRef, kanji.character);
    await setDoc(docRef, { kanji });
  };
};

export default storageWatcher;
