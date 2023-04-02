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
import WeatherWidget from '../components/WeatherWidget/WeatherWidget';

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
  const [modal, setModal] = useState({ show: false, kanji: {}, position: { top: 0, left: 0 }} );

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

  //group kanji by JLPT level
  const kanjiByJlpt = kanjiData.reduce((groupedKanji, kanji) => {
    const jlpt = kanji.jlpt_new || 1; // set default JLPT 1 if JLPT level is undefined
    if (!groupedKanji[jlpt]) {
      groupedKanji[jlpt] = [];
    }
    groupedKanji[jlpt].push(kanji);
    return groupedKanji;
  }, {});

  //group learned kanji by JLPT level
  const learnedKanjiByJlpt = learnedKanjiArray.reduce((groupedKanji, kanji) => {
    const jlpt = kanji.jlpt_new || 1; // set default JLPT 1 if JLPT level is undefined
    if (!groupedKanji[jlpt]) {
      groupedKanji[jlpt] = [];
    }
    groupedKanji[jlpt].push(kanji);
    return groupedKanji;
  }, {});

  //calculate the percentage of learned kanji in each category
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

  //modal options and position calc
  const showModal = (kanji: Kanji, event: React.MouseEvent<HTMLDivElement>) => {
    
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      top: (rect.top + rect.height / 2)+rect.height*.5,
      left: (rect.left + rect.width / 2)+rect.width*.5
    };
    setModal({ show: true, kanji, position });
  };

  const hideModal = () => setModal({ ...modal, show: false, position: { top: 0, left: 0 } });


return(
  <>
    <div className="home" onClick={() => {
  if (modal.show) {
    hideModal();
  }
}}>

      <div className='WeatherWidget'>
        <h3>Find out if the weather today is suitable for learning kanji</h3>
        <WeatherWidget />
      </div>

      <div className="stats">
        

        {modal.show && (
            <div className="homeModal" style={{ top: modal.position.top, left: modal.position.left }}>
              <button onClick={() => handleForgetKanji(modal.kanji)}>I forgot this kanji</button>
                         
            </div>
          )}
          
        {Object.keys(percentByJlpt).map((jlpt) => {
          if (jlpt !== "undefined") { // skip undefined JLPT levels
            return (

              <div key={jlpt} className='learned-group'>
                <h2>JLPT N{jlpt} kanji learned</h2>
                <ProgressBar percent={percentByJlpt[jlpt]} />
                {learnedKanjiByJlpt[jlpt] && learnedKanjiByJlpt[jlpt].length > 0 && (

                  <div className='learned-kanji'>
                    {learnedKanjiByJlpt[jlpt].map((kanji) => (


                      <button key={kanji.character} onClick={(event) => showModal(kanji, event)}><h3>{kanji.character}</h3></button>
                    ))}

                  </div>
                )}

              </div>
            );

          } else {
            percentByJlpt[1] = percentByJlpt[1] || 0; // add percentage to JLPT 1
            return null; // return null for undefined JLPT levels
          }

        })}
      </div> 
      
    </div>
  </>
  );
};