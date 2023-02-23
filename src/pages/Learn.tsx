//react
import React, {useEffect, useLayoutEffect, useState, useMemo}from 'react';
//firebase
import { database, db, auth } from '../config/firebase';
import { onValue, orderByChild, ref, query, get, child } from 'firebase/database';
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore";
//components, pages, styles
import Modal from '../components/Modal';
import "../styles/Learn.css"
//redux
import { useDispatch } from "react-redux";
import { addLearnedKanji } from "../learnedKanjiSlice";



export const Learn = () => {

  const [kanji, setKanji] = useState<Kanji[]>([]); 
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} })
  const [cachedData, setCachedData] = useState();
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);

  const [selectedLevels, setSelectedLevels] = useState([5, 4, 3, 2, 1]);

  const [selectedOption, setSelectedOption] = useState('sort_freq')
  const [sortByFreq, setSortByFreq] = useState(false);
  const [sortByGrade, setSortByGrade] = useState(false);
  const [sortByStrokes, setSortByStrokes] = useState(false);

  //dispatch the learnedKanjiArray into the global state
  // const dispatch = useDispatch();
  // dispatch(addLearnedKanji(learnedKanjiArray));
  
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

  //fetch learned kanji from localStorage and save them to a state variable
  useEffect(() => {
    const storedKanji = localStorage.getItem("learnedKanji");
    if (storedKanji) {
      const kanjiArray = JSON.parse(storedKanji);
      setLearnedKanjiArray(kanjiArray);
    }
  }, []);

  //move selected kanji to the "learned" collection in firestore
  const handleSaveKanji = (kanji: Kanji) => {

    const currentUser = auth.currentUser?.uid;
    const learnedRef = collection(db, "users", currentUser, "learned");
    const docRef = doc(learnedRef, kanji.character);
    setDoc(docRef, { kanji });
    
    setLearnedKanjiArray([...learnedKanjiArray, kanji]);
    saveKanji(kanji);
  };

  //save learned kanji to localStorage
  const saveKanji = (kanji: Kanji) => {
    let learnedKanjiArray = JSON.parse(localStorage.getItem("learnedKanjiArray")) || [];
    if (!learnedKanjiArray.some(k => k.character === kanji.character)) {
      learnedKanjiArray.push(kanji);
      localStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
    }
  };

  //fetch the users "learned" kanji collection on user login 
  useEffect(() => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return; // Don't do anything if currentUser is not defined yet
    }
  
    const getKanjis = async () => {
      const kanjiArray = [];
  
      const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "learned"));
      querySnapshot.forEach((doc) => {
        const kanjiData = doc.data();
        kanjiArray.push(kanjiData.kanji);
      });
  
      setLearnedKanjiArray(kanjiArray);
    }
  
    getKanjis();
  }, [auth.currentUser]);

  //fetch the main list of kanji if the user is logged in and cache those data
  useEffect(() => {

    if (!cachedData) {
      const kanjiRef = ref(database, 'jouyou');
      get(kanjiRef).then((snap) => {
        const kanjis = snap.val();
        setKanji(Object.values(kanjis));
        setCachedData(Object.values(kanjis));
      });
    } else {
      setKanji(cachedData);
    }
    
  }, []);


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
      
      // If no sorting criteria matched, preserve the original order
      return 0;
    });
    
    console.log(sortedKanji);
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
        const hue = 120 + normalizedFreq * 240; // range from green to blue
      
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
                    handleSaveKanji={handleSaveKanji}
                    createAnkiCard={createAnkiCard}
                  />
                )}
              <div id="container">
                {group.kanji.map((item, index) => (
                  <button key={index} onClick={() => showModal(item)} className="kanji-button" style={{ backgroundColor: colorScale(item.freq) }}>
                    {item.character}
                  </button>
                ))}
              </div>
          </div>          
          ))}
        </div>

      </div>

    </>
  );
  
};