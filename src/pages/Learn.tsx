import React, {useEffect, useLayoutEffect, useState}from 'react';
import { database, db, auth } from '../config/firebase';
import { onValue, orderByChild, ref, query, get, child } from 'firebase/database';
import "./Learn.css"
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore"; 

import { useDispatch } from "react-redux";
import { addLearnedKanji } from "../learnedKanjiSlice";


export const Learn = () => {

  const [kanji, setKanji] = useState<Kanji[]>([]);
  
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} });

  const [selectedOption, setSelectedOption] = useState('sort_freq')

  const [cachedData, setCachedData] = useState();

  const [learnedKanjiArray, setLearnedKanjiArray] = useState([]);

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
      const kanjiRef = ref(database, 'kyouiku');
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
  const handleChange = (event) => {
    setSelectedOption(event.target.value)
    
    if (event.target.value === 'sort_freq') {
      sortKanjiByFreq()
    } else if (event.target.value === 'sort_grade') {
      sortKanjiByGrade()
    } else if (event.target.value === 'sort_strokes') {
      sortKanjiByStrokes()
    }
  };

  //sort kanji by freq
  const sortKanjiByFreq = () => {
    kanji.sort((a, b) => (a.freq > b.freq) ? 1 : -1)
    setKanji([...kanji])
  };
  //sort kanji by grade
  const sortKanjiByGrade = () => {
    const sortedKanji = [...kanji].sort((a, b) => a.grade - b.grade)
    setKanji(sortedKanji)
  };
  //sort kanji by strokes
  const sortKanjiByStrokes = () => {
    const sortedKanji = [...kanji].sort((a, b) => a.strokes - b.strokes)
    setKanji(sortedKanji)
  };



  const showModal = (kanji: Kanji) => setModal({ show: true, kanji });

  const hideModal = () => setModal({ ...modal, show: false });

  const jlptLevels = [5,4,3,2,1];
















  const [sortByFreq, setSortByFreq] = useState(false);
  const [sortByGrade, setSortByGrade] = useState(false);
  const [sortByStrokes, setSortByStrokes] = useState(false);
  
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



  return (
    <>

      <select value={selectedOption} onChange={handleChange}>
        <option value="sort_freq">Sort by frequency</option>
        <option value="sort_grade">Sort by grade</option>
        <option value="sort_strokes">Sort by strokes</option>
      </select>

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
          <div>
            <div>Character: {modal.kanji.character}</div>
            <div>Meaning: {modal.kanji.meanings[0]}</div>
            <div>Frequency: {modal.kanji.freq}</div>
            <div>Grade: {modal.kanji.grade}</div>
            <div>JLPT (New): {modal.kanji.jlpt_new}</div>
            <div>JLPT (Old): {modal.kanji.jlpt_old}</div>
            <div>Strokes: {modal.kanji.strokes}</div>
            <button onClick={() => handleSaveKanji(modal.kanji)}>Move to learned</button>
            <button onClick={hideModal}>Close</button>
          </div>
        )}



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
            ))}
        </div>

      </div>

    </>
  );
  
};