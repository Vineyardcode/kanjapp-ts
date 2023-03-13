//react
import React, {useEffect, useLayoutEffect, useState, useMemo}from 'react';
//firebase
import { database, db, auth } from '../config/firebase';
import { onValue, orderByChild, ref, query, get, child, limitToFirst } from 'firebase/database';
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore";
//components, pages, styles
import Modal from '../components/Modal';
import "../styles/Learn.css"
import storageWatcher from '../store/storageWatcher';
//redux
import { useDispatch, useSelector } from 'react-redux';
import { fetchKanji } from '../store/features/kanjiSlice';

import joyo from "../kanjiData/joyo.json"

export const Learn = () => {

  const [kanji, setKanji] = useState(joyo); 
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} })
  
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);

  const [selectedLevels, setSelectedLevels] = useState([5, 4, 3, 2, 1]);

  
  const [sortByFreq, setSortByFreq] = useState(false);
  const [sortByGrade, setSortByGrade] = useState(false);
  const [sortByStrokes, setSortByStrokes] = useState(false);

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

  //fetch learned kanji from sessionStorage and save them to a state variable
  useEffect(() => {
    const storedKanji = sessionStorage.getItem("learnedKanjiArray");
    if (storedKanji) {
      const kanjiArray = JSON.parse(storedKanji);
      setLearnedKanjiArray(kanjiArray);
    }
  }, []);

  //save learned kanji to sessionStorage
  const saveKanji = (kanji: Kanji) => {
    let learnedKanjiArray = JSON.parse(sessionStorage.getItem("learnedKanjiArray")) || [];
    if (!learnedKanjiArray.some(k => k.character === kanji.character)) {
      learnedKanjiArray.push(kanji);
      sessionStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
      
    }
    setLearnedKanjiArray(learnedKanjiArray)
  };

  //call the sorting function every time a sorting option is changed
  useEffect(() => {
    sortKanji();
  }, [sortByFreq, sortByGrade, sortByStrokes]);

  //functions for sorting the kanji
  const sortKanji = () => {
    let filteredKanji = kanji.filter(k => selectedLevels.includes(k.jlpt_new));
    let sortedKanji = [...filteredKanji];
  
    sortedKanji.sort((a, b) => {
      if (sortByFreq) {
        if (a.freq && b.freq) {
          return a.freq - b.freq;
        } else if (a.freq) {
          return -1;
        } else if (b.freq) {
          return 1;
        }
      }
  
      if (sortByGrade) {
        return a.grade - b.grade;
      }
  
      if (sortByStrokes) {
        return a.strokes - b.strokes;
      }
  
      // sort items with undefined jlpt_new property to the end of the list
      const aJlpt = a.jlpt_new || Infinity;
      const bJlpt = b.jlpt_new || Infinity;
      return aJlpt - bJlpt;
    });
  
    setKanji(sortedKanji);

    
  };
  
  const handleSortByFreqChange = () => {
    setSortByFreq(!sortByFreq);

  };

  const handleSortByGradeChange = () => {
    setSortByGrade(!sortByGrade);
  };

  const handleSortByStrokesChange = () => {
    setSortByStrokes(!sortByStrokes);
  };

  //create anki flash cards out of selected kanji
  const createAnkiCard = (kanjiData: Kanji) => {
    const api = new XMLHttpRequest();
    api.open("POST", "http://localhost:8765");
  
    const note = {
      deckName: "Default",
      modelName: "Basic",
      fields: {
        Front: kanjiData.character,
        Back: kanjiData.meanings+' ',

      },
      tags: []
    };
  
    api.send(JSON.stringify({
      action: "addNote",
      version: 6,
      params: {
        note: note
      }
    }));
  
    api.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        console.log(`Kanji ${kanjiData.character} was added to Anki successfully!`);
        
      }
    };
  };

  //modal options
  const showModal = (kanji: Kanji) => setModal({ show: true, kanji });
  const hideModal = () => setModal({ ...modal, show: false });

  //calculate color based on frequency
  const colorScale = (freq?: number) => {

      if (freq === undefined) {
          return 'rgb (0,255, 0)';
        }

        const minFreq = 1;
        const maxFreq = 2495;
        const normalizedFreq = (freq - minFreq) / (maxFreq - minFreq);
        const hue = 120 + (normalizedFreq * -120); // range from green to red
      
        return `hsl(${hue}, 100%, 50%)`;
  };

  //filter kanjis and group them by JLPT
  const sortedKanji = selectedLevels.map((level) => {
    const kanjiForLevel = kanji
        .filter((kanji) => kanji.jlpt_new === level)
        .filter((kanji) => !learnedKanjiArray.some((k) => k.character === kanji.character))
        .sort((a, b) => b.jlpt_new - a.jlpt_new);
  
      return {
        level,
        kanji: kanjiForLevel,
      };
    });

  //handling of user selected JLPT levels
  const handleLevelSelection = (e) => {
    const level = Number(e.target.value);
    const index = selectedLevels.indexOf(level);

    if (index === -1) {
      setSelectedLevels([...selectedLevels, level]);
    } else {
      setSelectedLevels(selectedLevels.filter((l) => l !== level));
    }
  };

  return (
    <>

    <div>

      <section>
        <h3>Sort</h3>
            <label>
                <input type="checkbox" checked={sortByFreq} onChange={handleSortByFreqChange} />
                Sort by frequency
              </label>
              <label>
                <input type="checkbox" checked={sortByGrade} onChange={handleSortByGradeChange} />
                Sort by grade
              </label>
              <label>
                <input type="checkbox" checked={sortByStrokes} onChange={handleSortByStrokesChange} />
                Sort by strokes
            </label>
      </section>

      <div>
        <h3>Select JLPT levels:</h3>
        {[5, 4, 3, 2, 1].map((level) => (
          <label key={level}>
            <input
              type="checkbox"
              value={level}
              checked={selectedLevels.includes(level)}
              onChange={handleLevelSelection}
            />
            N{level}
          </label>
        ))}
      </div>

      <div>
        {sortedKanji.map((group) => (
          <div key={group.level}>
            <h2>JLPT Level {group.level}</h2>
                {modal.show && (
                  <Modal
                    show={modal.show}
                    kanji={modal.kanji}
                    hideModal={hideModal}
                    handleSaveKanji={saveKanji}
                    createAnkiCard={createAnkiCard}
                  />
                )}
              <div id="container">
                {group.kanji.map((item, index) => (
                  <button key={item.character} onClick={() => showModal(item)} className="kanji-button" style={{ backgroundColor: colorScale(item.freq) }}>
                    {item.character}
                  </button>
                ))}
              </div>
          </div>          
          ))}
        </div>

      </div>
      {storageWatcher()}
    </>
  );
  
};