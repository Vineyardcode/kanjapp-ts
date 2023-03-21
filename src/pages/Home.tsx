//react
import React from 'react'
import { useState, useEffect } from 'react';
//firebase
import { database, db, auth } from '../config/firebase';
import { doc, setDoc, collection, deleteDoc, getDocs, } from "firebase/firestore";
//components & data
import ProgressBar from '../components/ProgressBar';
import joyo from "../kanjiData/joyo.json"
//style
import "../styles/Home.css"

export const Home = () => {

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
  interface Modal {
    show: boolean;
    kanji: Kanji;
  }

  const [kanjiData, setKanjiData] = useState(joyo);
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} });

  //fetch kanji from localStorage
  const readFromLocalStorage = () => {
    const storedKanji = localStorage.getItem("learnedKanjiArray");
    if (storedKanji) {
      const kanjiArray: Kanji[] = JSON.parse(storedKanji);
      setLearnedKanjiArray(kanjiArray);
    }
  };
      useEffect(() => {
        readFromLocalStorage();
      }, []);

  // First, group kanji by JLPT level
  const kanjiByJlpt = kanjiData.reduce((groupedKanji, kanji) => {
    const jlpt = kanji.jlpt_new || 1; // set default JLPT 1 if JLPT level is undefined
    if (!groupedKanji[jlpt]) {
      groupedKanji[jlpt] = [];
    }
    groupedKanji[jlpt].push(kanji);
    return groupedKanji;
  }, {});

  // Then, group learned kanji by JLPT level
  const learnedKanjiByJlpt = learnedKanjiArray.reduce((groupedKanji, kanji) => {
    const jlpt = kanji.jlpt_new || 1; // set default JLPT 1 if JLPT level is undefined
    if (!groupedKanji[jlpt]) {
      groupedKanji[jlpt] = [];
    }
    groupedKanji[jlpt].push(kanji);
    return groupedKanji;
  }, {});

  // Finally, calculate the percentage of learned kanji in each category
  const percentByJlpt = {};
  Object.keys(kanjiByJlpt).forEach((jlpt) => {
    const kanjiCount = kanjiByJlpt[jlpt].length;
    const learnedKanji = learnedKanjiByJlpt[jlpt] || [];
    const learnedKanjiCount = learnedKanji.length;
    const percent = (learnedKanjiCount / kanjiCount) * 100 || 0;
    percentByJlpt[jlpt] = percent;
  });

  //delete kanji from the database and from localStorage
  const handleForgetKanji = async (kanji: Kanji) => {
    let learnedKanjiArray = JSON.parse(localStorage.getItem("learnedKanjiArray")) || [];
    learnedKanjiArray = learnedKanjiArray.filter(k => k.character !== kanji.character);
    localStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));

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

  //modal options
  const showModal = (kanji: Kanji) => setModal({ show: true, kanji });
  const hideModal = () => setModal({ ...modal, show: false });

return(
  <>
    <div className="stats">
      <h1>Kanji you learned so far:</h1>

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
            {/* <button onClick={() => handleKanjiClick(modal.kanji.character)}> test aaa</button> */}          
          </div>
        )}
      {Object.keys(percentByJlpt).map((jlpt) => {
        if (jlpt !== "undefined") { // skip undefined JLPT levels
          return (
            <div key={jlpt}>
              <h2>JLPT N{jlpt} kanji learned</h2>
              <ProgressBar percent={percentByJlpt[jlpt]} />
              {learnedKanjiByJlpt[jlpt] && learnedKanjiByJlpt[jlpt].length > 0 && (
                <ul>
                  {learnedKanjiByJlpt[jlpt].map((kanji) => (
                    <button key={kanji.character} onClick={() => showModal(kanji)}>{kanji.character}</button>
                  ))}

                </ul>
              )}

            </div>
          );
        } else {
          percentByJlpt[1] = percentByJlpt[1] || 0; // add percentage to JLPT 1
          return null; // return null for undefined JLPT levels
        }
      })}
    </div>  


  </>
);
};