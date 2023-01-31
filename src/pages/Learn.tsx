import React, {useEffect, useState}from 'react';
import { database, db, auth } from '../config/firebase';
import { onValue, orderByChild, ref, query, get, child } from 'firebase/database';
import "./Learn.css"
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore"; 


export const Learn = () => {

  const [kanji, setKanji] = useState<Kanji[]>([]);
  
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} });

  const [selectedOption, setSelectedOption] = useState('sort_freq')

  const [cachedData, setCachedData] = useState();

  

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

  const filterLearnedKanji = async () => {
    const currentUser = auth.currentUser?.uid;
    const kanjiArray = []
    
    if (!currentUser) return;
    const learnedKanji = await getDocs(collection(db, "users", currentUser, "learned"))

    learnedKanji.forEach((doc) => {

      const kanjiData = doc.data()
      kanjiArray.push(kanjiData.kanji)
         
    });

    const learnedKanjiCharacters = kanjiArray.map((kanji) => kanji.character);
    const filteredKanji = kanji.filter((kanji) => !learnedKanjiCharacters.includes(kanji.character))
    
    setKanji(filteredKanji);
  }

  // filterLearnedKanji()



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
    setKanji([...kanji])
  }
  //sort kanji by grade
  const sortKanjiByGrade = () => {
    const sortedKanji = [...kanji].sort((a, b) => a.grade - b.grade)
    setKanji(sortedKanji)
  }
  //sort kanji by strokes
  const sortKanjiByStrokes = () => {
    const sortedKanji = [...kanji].sort((a, b) => a.strokes - b.strokes)
    setKanji(sortedKanji)
  }


  //move selected kanji to the "learned" category
  const handleSaveKanji = (kanji: Kanji) => {

    const currentUser = auth.currentUser?.uid
    kanji.category = "learned";
    
    setDoc(doc(db, "users", currentUser, "learned", kanji.character), {
      kanji
    });
     
  }




  return (
    <>

      <select value={selectedOption} onChange={handleChange}>
        <option value="sort_freq">Sort by frequency</option>
        <option value="sort_grade">Sort by grade</option>
        <option value="sort_strokes">Sort by strokes</option>
      </select>

      <div>
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
        {kanji.map((item, index) => (
          <button key={index} onClick={() => showModal(item)}>
            {item.character}
          </button>
        ))}
      </div>

    </>
  );
  
};