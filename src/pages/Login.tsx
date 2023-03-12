//react
import { useNavigate } from "react-router-dom";
//firebase
import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../config/firebase";
//redux toolkit
import { useDispatch } from "react-redux";
import { loginUser } from "../store/features/authSlice";

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider).then(
      async (result) => {
        // Save the user to the database
        const currentUser = result.user.uid
        try {
          const docRef = await setDoc(
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







  return (
    <div>
      <p> Sign In With Google To Continue </p>
      <button onClick={signInWithGoogle}> Sign In With Google </button>
    </div>
  );
};