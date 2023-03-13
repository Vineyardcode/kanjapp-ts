//react
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

//firebase
import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, provider, db } from "../config/firebase";

//redux toolkit
import { useDispatch } from "react-redux";
import { loginUser } from "../store/features/authSlice";
import { current } from "@reduxjs/toolkit";

export const Login = () => {

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

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider).then(
      async (result) => {
        // Save the user to the database
        const currentUser = result.user.uid
        try {
          await setDoc(
            doc(db, "users", currentUser),
            {
              email: auth.currentUser?.email,
              uid: result.user.uid,
            },
            { merge: true }
          );
  
          // Fetch the user's "learned" kanji collection
          const querySnapshot = await getDocs(collection(db, "users", currentUser, "learned"));
          const learnedKanjiArray = querySnapshot.docs.map((doc) => doc.data().kanji);
  
          // Save the "learned" kanji collection to sessionStorage
          sessionStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));

          // Dispatch login action
          dispatch(loginUser({
            email: auth.currentUser?.email,
            uid: result.user.uid,

          }));
             
        } catch (e) {
          console.error("Error adding document: ", e);
        }
      }
    );
    console.log(result);
    navigate("/");
  };


  useEffect(() => {

    

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



  }, [])

  return (
    <div>
      <p> Sign In With Google To Continue </p>
      <button onClick={signInWithGoogle}> Sign In With Google </button>
    </div>
  );
};