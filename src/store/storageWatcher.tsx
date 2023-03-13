import React, { useEffect } from 'react';
//firebase
import { db, auth } from '../config/firebase';
import { doc, setDoc, collection } from "firebase/firestore";
//RTK
import { useSelector } from 'react-redux';

const StorageWatcher = () => {
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const saveDataBeforeUnload = (event: BeforeUnloadEvent) => {
      const storedKanji = JSON.parse(sessionStorage.getItem("learnedKanjiArray") || "[]") as Kanji[];
      storedKanji.forEach((kanji: Kanji) => {
        handleSaveKanji(kanji);
      });
      console.log("ťuky ťuk ahojky kluci");
    };
    const handleSaveKanji = async (kanji: Kanji) => {
      const currentUser = user?.uid;
      if (currentUser) {
        const learnedRef = collection(db, "users", currentUser, "learned");
        const docRef = doc(learnedRef, kanji.character);
        await setDoc(docRef, { kanji });
      }
    };

    window.addEventListener('beforeunload', saveDataBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', saveDataBeforeUnload);
    };
  }, [user]);

  return null;
};

export default StorageWatcher;