import React, {useEffect, useLayoutEffect, useState}from 'react';

import { database, db, auth } from '../config/firebase';
import { onValue, orderByChild, ref, query, get, child } from 'firebase/database';
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore";

import Modal from '../components/Modal';
import "./Learn.css"

import { useDispatch } from "react-redux";
import { addLearnedKanji } from "../learnedKanjiSlice";


export const Learn = () => {

  const [kanji, setKanji] = useState<Kanji[]>([]);
  
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} });

  const [selectedOption, setSelectedOption] = useState('sort_freq')

  const [cachedData, setCachedData] = useState();

  const [learnedKanjiArray, setLearnedKanjiArray] = useState([]);

  const [sortByFreq, setSortByFreq] = useState(false);
  const [sortByGrade, setSortByGrade] = useState(false);
  const [sortByStrokes, setSortByStrokes] = useState(false);

  //dispatch the learnedKanjiArray into the global state
  // const dispatch = useDispatch();
  // dispatch(addLearnedKanji(learnedKanjiArray));
  
  interface Kanji {
    character?: string;
    meanings: string[];
    freq?: number;
    grade?: number;
    jlpt_new?: number;
    jlpt_old?: number;
    category: string;
    strokes: number;
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

  //save learned kanji to localStorage
  const saveKanji = (kanji: Kanji) => {
    let learnedKanjiArray = JSON.parse(localStorage.getItem("learnedKanjiArray")) || [];
    if (!learnedKanjiArray.some(k => k.character === kanji.character)) {
      learnedKanjiArray.push(kanji);
      localStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
    }
  };

  //move selected kanji to the "learned" collection in firestore
  const handleSaveKanji = (kanji: Kanji) => {
    
    const currentUser = auth.currentUser?.uid
    kanji.category = "learned";
    
    setDoc(doc(db, "users", currentUser, "learned", kanji.character), {
      kanji
    });
    
    setLearnedKanjiArray([...learnedKanjiArray, kanji]);
    saveKanji(kanji)
  };

  //fetch the users learned kanji collection on user login 
  useEffect(() => {

    const getKanjis = async () => {

      const kanjiArray = []

      const currentUser = auth.currentUser?.uid

      const querySnapshot = await getDocs(collection(db, "users", currentUser, "learned"));
      querySnapshot.forEach((doc) => {

      const kanjiData = doc.data()
      
      kanjiArray.push(kanjiData.kanji)
      
    });

    
    setLearnedKanjiArray(kanjiArray)
  }

  getKanjis()
  
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

  // call the sorting function based on the selected option
  const handleSortByFreqChange = () => {
    setSortByFreq(!sortByFreq);
  };
  
  const handleSortByGradeChange = () => {
    setSortByGrade(!sortByGrade);
  };
  
  const handleSortByStrokesChange = () => {
    setSortByStrokes(!sortByStrokes);
  };
  
  const sortKanji = () => {
    let sortedKanji = [...kanji];
  
    if (sortByFreq) {
      sortedKanji.sort((a, b) => (a.freq > b.freq) ? 1 : -1)
    }
  
    if (sortByGrade) {
      sortedKanji.sort((a, b) => a.grade - b.grade)
    }
  
    if (sortByStrokes) {
      sortedKanji.sort((a, b) => a.strokes - b.strokes)
    }
  
    setKanji(sortedKanji);
  };
  
  useEffect(() => {
    sortKanji();
  }, [sortByFreq, sortByGrade, sortByStrokes]);

  const showModal = (kanji: Kanji) => setModal({ show: true, kanji });

  const hideModal = () => setModal({ ...modal, show: false });

  

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

  const jlptLevels = [5,4,3,2,1];

  return (
    <>

    <div>

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
      
        <div>
            {jlptLevels.map((level) => (
              
              <div key={level}>
                <h2>JLPT Level {level}</h2>
                
                {modal.show && (
                <Modal modal={modal} hideModal={() => hideModal} handleSaveKanji={() => handleSaveKanji} createAnkiCard={() => createAnkiCard}/>
            )}
<div id="main">
<div id="container">
                {kanji
                    .filter((kanji) => kanji.jlpt_new === level)
                    .sort((a, b) => b.jlpt_new - a.jlpt_new)
                    .filter(kanji => !learnedKanjiArray.some(k => k.character === kanji.character))
                    .map((item, index) => (

                    <button key={index} onClick={() => showModal(item)}>
                      {item.character}
                    </button>
                   
                    ))
                  }
 </div>
</div>
              </div>
            ))}
        </div>

      </div>

    </>
  );
  
};