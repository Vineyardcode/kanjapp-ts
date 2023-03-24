//react
import React, {useEffect, useState}from 'react';
//firebase
import { database, db, auth } from '../config/firebase';
import { doc, setDoc, collection } from "firebase/firestore";
//components, pages, styles
import Modal from '../components/Modal';
import "../styles/Learn.css"
import joyo from "../kanjiData/joyo.json"
import KVGindex from "../kanjiData/kvg-index.json"

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

export const Learn = () => {

  //info management
  const [kanji, setKanji] = useState(joyo); 
  const [modal, setModal] = useState<Modal>({ show: false, kanji: {} })
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [sortByFreq, setSortByFreq] = useState(false);
  const [sortByGrade, setSortByGrade] = useState(false);
  const [sortByStrokes, setSortByStrokes] = useState(false);
  //selector
  const [selectedKanji, setSelectedKanji] = useState<Kanji[]>([]);
  const [numKanji, setNumKanji] = useState(9999);
  const [minStrokes, setMinStrokes] = useState(1);
  const [maxStrokes, setMaxStrokes] = useState(2);
  const [jlptLevel, setJlptLevel] = useState<string | number>('All');
  const [minGrade, setMinGrade] = useState(1);


  // fetch kanjis
  const fetchData = async () => {
    try {
      const response = await fetch('src/kanjiData/joyo.json');
      const json = await response.json();
      setKanji(json);
    } catch (error) {
      console.error(error);
      
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedLevels])

  //fetch learned kanji from localStorage and save them to a state variable
  useEffect(() => {
    const storedKanji = localStorage.getItem("learnedKanjiArray");
    if (storedKanji) {
      const kanjiArray = JSON.parse(storedKanji);
      setLearnedKanjiArray(kanjiArray);
    }
  }, []);

  //
  const handleSaveKanji = async (kanji: Kanji) => { 

    const currentUser = auth.currentUser?.uid;
      if (currentUser) {
        const learnedRef = collection(db, "users", currentUser, "learned");
        const docRef = doc(learnedRef, kanji.character);
        await setDoc(docRef, { kanji });    
    }  

  };

  //save learned kanji to localStorage 
  const saveKanji = (kanji: Kanji) => {
    let learnedKanjiArray = JSON.parse(localStorage.getItem("learnedKanjiArray")) || [];
    if (!learnedKanjiArray.some(k => k.character === kanji.character)) {
      learnedKanjiArray.push(kanji);
      localStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
      
    }
    setLearnedKanjiArray(learnedKanjiArray)
    handleSaveKanji(kanji)
  };

  // call the sorting function every time a sorting option is changed
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
  
      // sort items with some undefined property to the end of the list
      const aJlpt = a.jlpt_new || Infinity;
      const bJlpt = b.jlpt_new || Infinity;
      return aJlpt - bJlpt;
      const aStrokes = a.strokes || Infinity;
      const bStrokes = b.strokes || Infinity;
      return aStrokes - bStrokes;
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

  // create anki flash cards out of selected kanji
  const createAnkiCard = (kanjiData, kanjiVGID, svgPaths) => {
    const api = new XMLHttpRequest();
    const model = {
      modelName: kanjiData.character,
      inOrderFields: ["Character", "Meaning"],
      css: `
      path {
        fill:none;
        stroke: black;
        stroke-width:1;
      }`,
      cardTemplates: [
        {
          Name: "Recognition",
          Front: "{{Character}}",
          Back: `      
          <div>{{Meaning}}</div> 
          <div className="kanji">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            xmlSpace="preserve"
            version="1.1"
            baseProfile="full"
          >
          ${svgPaths.outerHTML}
          </svg>
        </div>
        <script>
        function waitForStroke() {
          const kanjiVG = "${kanjiVGID}"
          const kanjiVG1 = "#kvg\\\\:" + kanjiVG + " path"
          const path = document.querySelectorAll(kanjiVG1);               
          let hue = 200
          for (let i = 0; i < path.length; i++) {
            path[i].style.stroke = "hsl(" + hue + ", 100%, 50%)";
            hue += 35;
            const start = path[i].getPointAtLength(0);
            const number = document.createElementNS("http://www.w3.org/2000/svg", "text");
            number.setAttribute("x", start.x);
            number.setAttribute("y", start.y);
            number.textContent = i + 1;
            number.setAttribute("font-size", "5px");
            const strokesSVG = document.querySelector('svg');
            strokesSVG.appendChild(number);  
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", start.x);
            dot.setAttribute("cy", start.y);
            dot.setAttribute("r", "1.5");
            dot.setAttribute("fill", "rgba(0,0,0,0.5)");
            strokesSVG.appendChild(dot);
          }
        }    
        new Promise(resolve => {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
          } else {
            resolve();
          }
        }).then(waitForStroke);
      </script>`,
        }
      ]
    };
    api.open("POST", "http://localhost:8765");
    api.send(JSON.stringify({
      action: "createModel",
      version: 6,
      params: model
    }));
    api.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        console.log(`Model ${model.modelName} was created successfully!`);
        const note = {
          deckName: "Default",
          modelName: model.modelName,
          fields: {
            Character: kanjiData.character,
            Meaning: kanjiData.meanings.join(", "),  
          },
          tags: []
        };
        api.open("POST", "http://localhost:8765");
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
      }
    };
  };
  
  const handleGenerateKanji = () => {
    // Filter out already learned kanji
    const filteredKanjiData = kanji.filter(kanji => {
      return !learnedKanjiArray.some(learnedKanji => learnedKanji.character === kanji.character);
    });
  
    // Create list of kanji
    let filteredKanji = filteredKanjiData.filter(
      (kanji) =>
        kanji.strokes >= minStrokes &&
        kanji.strokes <= maxStrokes &&
        kanji.grade >= minGrade
    );
    if (jlptLevel !== "All") {
      filteredKanji = filteredKanji.filter(
        (kanji) => kanji.jlpt_new === jlptLevel
      );
    }

    const selected = filteredKanji.slice(0, numKanji);
    setSelectedKanji(selected);
    
  };
  
  const createBatch = async (kanjiBatch: Kanji[]) => {
    for (const kanji of kanjiBatch) {
      try {
        // look up the kanjiVG index for the given kanji
        const kanjiIndex = KVGindex[kanji.character].find(index => index.length === 9).slice(0, -4);
        const response2 = await fetch('src/kanjiData/joyo_kanji_vg.xml');
        const xmlString = await response2.text();
        const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
      
        // look up the kanji svg in the XML file using the kanji VG index
        const kanjiElement = xmlDoc.querySelector(`[id="kvg:${kanjiIndex}"]`);
      
        await createAnkiCard(kanji, `${kanjiIndex}`, kanjiElement);
      } catch (error) {
        console.error(error);
      }
    }
  };
  
  const create = async () => {
    const batchSize = 10; // set the batch size here
    const numBatches = Math.ceil(selectedKanji.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, selectedKanji.length);
      const kanjiBatch = selectedKanji.slice(start, end);
      await createBatch(kanjiBatch);
    }
  };
  
  useEffect(() => {
    console.log(selectedKanji);
    console.log(numKanji);
    
  }, [selectedKanji]);

 
  return (
      <>

      <div>

        <div className="selector">
          <div className="params">
          <div>
            <label htmlFor="numKanji">Number of Kanji:</label>
            <input
            type="number"
            name="numKanji"
            value={numKanji}
            onChange={(e) => setNumKanji(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="minStrokes">Minimum strokes:</label>
            <input
              type="number"
              name="minStrokes"
              value={minStrokes}
              onChange={(e) => setMinStrokes(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="maxStrokes">Maximum strokes:</label>
            <input
              type="number"
              name="maxStrokes"
              value={maxStrokes}
              onChange={(e) => setMaxStrokes(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="jlptLevel">JLPT level:</label>
            <select
              name="jlptLevel"
              value={jlptLevel}
              onChange={(e) => setJlptLevel(Number(e.target.value))}
            >
              <option value="">All</option>
              <option value={1}>N1</option>
              <option value={2}>N2</option>
              <option value={3}>N3</option>
              <option value={4}>N4</option>
              <option value={5}>N5</option>
              
            </select>
          </div>
          <div>
            <label htmlFor="minGrade">Minimum grade:</label>
            <select
              name="minGrade"
              value={minGrade}
              onChange={(e) => setMinGrade(Number(e.target.value))}
            >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={8}>8</option>
            <option value={9}>9</option>
            </select>
          </div>

      
          <button onClick={handleGenerateKanji}>Create</button>
          
          </div>
        </div>

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

                <div id="container">
                  {group.kanji.map((item, index) => (
                    <button key={item.character} onClick={() => showModal(item)} className="kanji-button" style={{ backgroundColor: colorScale(item.freq) }}>
                      {item.character}
                      
                    </button>
                  ))}
                </div>
            </div>          
            ))}

            {modal.show && (
                <Modal
                  show={modal.show}
                  kanji={modal.kanji}
                  hideModal={hideModal}
                  handleSaveKanji={saveKanji}
                  createAnkiCard={createAnkiCard}
                  
                />
                
              )}
        </div>

      </div>
        
    </>
  );
  
};