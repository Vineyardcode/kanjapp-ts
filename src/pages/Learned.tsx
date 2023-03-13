import React, {useEffect, useState}from 'react';
import { database, db, auth } from '../config/firebase';
import "../styles/Learn.css"
import { doc, setDoc, collection, deleteDoc, getDocs, } from "firebase/firestore"; 

import { useSelector } from 'react-redux';



const Learned: React.FC = () => {

  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);
 
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} });

  const [selectedOption, setSelectedOption] = useState('sort_freq')
  
  //kanji fetching
  useEffect(() => {
    readFromSessionStorage();
  }, []);
  
  const readFromSessionStorage = () => {
    const storedKanji = sessionStorage.getItem("learnedKanjiArray");
    if (storedKanji) {
      const kanjiArray: Kanji[] = JSON.parse(storedKanji);
      setLearnedKanjiArray(kanjiArray);
    }
  };

  interface Kanji {
    character?: string;
    meanings: string[]; 
    freq?: number;
    grade?: number;
    jlpt_new?: number;
    jlpt_old?: number;
    category?: string;
    strokes?: number;
  }
  
  interface Modal {
    show: boolean;
    kanji: Kanji;
  }
  //modal options and sorting
  const showModal = (kanji: Kanji) => setModal({ show: true, kanji });

  const hideModal = () => setModal({ ...modal, show: false });

  const handleChange = (event) => {
    setSelectedOption(event.target.value)
    // call the sorting function based on the selected option
    if (event.target.value === 'sort_freq') {
      sortKanji()
    } else if (event.target.value === 'sort_grade') {
      sortKanjiByGrade()
    } else if (event.target.value === 'sort_strokes') {
      sortKanjiByStrokes()
    }
  }

  //sort kanji by freq
  const sortKanji = () => {
    kanji.sort((a, b) => (a.freq > b.freq) ? 1 : -1)
    setLearnedKanjiArray([...learnedKanjiArray])
  }
  //sort kanji by grade
  const sortKanjiByGrade = () => {
    const sortedKanji = [...learnedKanjiArray].sort((a, b) => a.grade - b.grade)
    setLearnedKanjiArray(sortedKanji)
  }
  //sort kanji by strokes
  const sortKanjiByStrokes = () => {
    const sortedKanji = [...learnedKanjiArray].sort((a, b) => a.strokes - b.strokes)
    setLearnedKanjiArray(sortedKanji)
  }

  //delete kanji from the database and from sessionStorage
  const handleForgetKanji = async (kanji: Kanji) => {
    let learnedKanjiArray = JSON.parse(sessionStorage.getItem("learnedKanjiArray")) || [];
    learnedKanjiArray = learnedKanjiArray.filter(k => k.character !== kanji.character);
    sessionStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
  
    const currentUser = auth.currentUser?.uid;
    if (currentUser) {
      const kanjiRef = doc(collection(db, "users", currentUser, "learned"), kanji.character);
      try {
        await deleteDoc(kanjiRef);
        console.log("Kanji deleted successfully from Firestore");
      } catch (error) {
        console.error("Error deleting kanji from Firestore: ", error);
      }
    }
    setLearnedKanjiArray(learnedKanjiArray)
  };

  return (
    <>

    <select value={selectedOption} onChange={handleChange}>
      <option value="sort_freq">Sort by frequency</option>
      <option value="sort_grade">Sort by grade</option>
      <option value="sort_strokes">Sort by strokes</option>
    </select>

    {learnedKanjiArray.length === 0 ? (
      <h1>You know nothing !</h1>
    ) : (
      <div>
        {modal.show && (
          <div>
            <div>Character: {modal.kanji.character}</div>
            <div>Meaning: {modal.kanji.meanings[0]}</div>
            <div>Frequency: {modal.kanji.freq}</div>
            <div>Grade: {modal.kanji.grade}</div>
            <div>JLPT (New): {modal.kanji.jlpt_new}</div>
            <div>Strokes: {modal.kanji.strokes}</div>
            <button onClick={() => handleForgetKanji(modal.kanji)}>Forget this kanji</button>
            <button onClick={hideModal}>Close</button>
          </div>
        )}
        {learnedKanjiArray.map((item, index) => (
          <button key={index} onClick={() => showModal(item)}>
            {item.character}
          </button>
        ))}
      </div>
    )}
    
    </>
  );
  
}
export default Learned






