//react
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

//firebase
import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, provider, db } from "../config/firebase";


export const Login = () => {

  const navigate = useNavigate();

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
          localStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
          
        } catch (e) {
          console.error("Error adding document: ", e);
        }
      }
    );
    console.log(result);
    navigate("/Learn");
  };


  return (
    <div className="login-main">
      <h3>save your learning progress by signing in</h3>
      <button onClick={signInWithGoogle}><h5>Sign In With Google</h5></button>
    </div>
  );
};