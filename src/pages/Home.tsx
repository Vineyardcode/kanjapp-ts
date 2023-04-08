//react
import React from 'react'
import { useState, useEffect } from 'react';
//firebase
import { database, db, auth } from '../config/firebase';
import { doc, setDoc, collection, deleteDoc, getDocs, } from "firebase/firestore";
//components & data
import ProgressBar from '../components/ProgressBar';
// import joyo from "../kanjiData/joyo.json"
import { Link } from 'react-router-dom';
import IconHeart from '../assets/icons/heart';
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
    [key: string]: any;
  }
  interface Modal {
    show: boolean;
    kanji: Kanji;
    position: { top: number, left: number };
  }

  const [kanjiData, setKanjiData] = useState<Kanji[]>([]);
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {}, position: { top: 0, left: 0 }} );

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
  const kanjiByJlpt: Record<string, Kanji[]>  = kanjiData.reduce((groupedKanji, kanji) => {
    const jlpt= kanji.jlpt_new || 1; // set default JLPT 1 if JLPT level is undefined
    if (!groupedKanji[jlpt]) {
      groupedKanji[jlpt] = [];
    }
    groupedKanji[jlpt].push(kanji);
    return groupedKanji;
  }, {});

  //group learned kanji by JLPT level
  const learnedKanjiByJlpt  = learnedKanjiArray.reduce((groupedKanji, kanji) => {
    const jlpt = kanji.jlpt_new || 1; // set default JLPT 1 if JLPT level is undefined
    if (!groupedKanji[jlpt]) {
      groupedKanji[jlpt] = [];
    }
    groupedKanji[jlpt].push(kanji);
    return groupedKanji;
  }, {});

  //calculate the percentage of learned kanji in each category
  const percentByJlpt: Record<string, number>= {};
  Object.keys(kanjiByJlpt).forEach((jlpt: any) => {
    const kanjiCount = kanjiByJlpt[jlpt].length;
    const learnedKanji = learnedKanjiByJlpt[jlpt] || [];
    const learnedKanjiCount = learnedKanji.length;
    const percent = (learnedKanjiCount / kanjiCount) * 100 || 0;
    percentByJlpt[jlpt] = percent;
  });

  //delete kanji from the database and from localStorage
  const handleForgetKanji = async (kanji: Kanji) => {
    let learnedKanjiArray: Kanji[] = JSON.parse(localStorage.getItem("learnedKanjiArray") || "[]");
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
  const showModal = (kanji: Kanji, event: any) => {
    
    const position = {
      top: (event.currentTarget.offsetTop)+30,
      left: (event.currentTarget.offsetLeft)+30
    };
    setModal({ show: true, kanji, position});
    
    
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
                <h3>JLPT N{jlpt} kanji learned</h3>
                <ProgressBar percent={percentByJlpt[jlpt]}/>
                {learnedKanjiByJlpt[jlpt] && learnedKanjiByJlpt[jlpt].length > 0 && (

                  <div className='learned-kanji'>
                    {learnedKanjiByJlpt[jlpt].map((kanji: any) => (


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

      <div className="about">
        <h3>Info</h3>
          <div className='info'>
            
                <h5>To create Anki cards, you need to have the <a href="https://ankiweb.net/shared/info/2055492159">Anki Connect</a> addon installed and have the anki app open while creating the cards</h5> 

                <h5>Only <a href="https://en.wikipedia.org/wiki/J%C5%8Dy%C5%8D_kanji">joyo</a> kanji are available at the moment. For more kanji, please check in later</h5>

                <h5>More features incoming !</h5>
    
          </div>
      </div>

      <div className="about">
        <h3>About</h3>
          <div className='info'>
            
                <h5>Kanji data are taken from <a href="https://kanjiapi.dev/">kanjiapi.dev</a>, which uses the EDICT and KANJIDIC dictionary files. These files are the property of the <a href="http://www.edrdg.org/">Electronic Dictionary Research and Development Group</a>, and are used in conformance with the Group's <a href="http://www.edrdg.org/edrdg/licence.html">licence</a></h5>
              
              
                <h5>Kanji stroke order data are taken from the <a href="https://kanjivg.tagaini.net/index.html">Kanji VG</a> project</h5>
              
                          
                <h5>The weather widget is powered by the <a href="https://openweathermap.org/">OpenWeather</a> and the <a href="https://rapidapi.com/wirefreethought/api/geodb-cities">GeoDB</a> API's</h5>              
              
              
                <h5>Made with <IconHeart/> by <a href="https://github.com/Vineyardcode">Vine</a></h5>
                 
          </div>
      </div>  

    </div>

  </>
  );
};