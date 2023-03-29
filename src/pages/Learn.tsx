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
  const [selectedLevels, setSelectedLevels] = useState([5]);
  const [sortByFreq, setSortByFreq] = useState(false);
  const [sortByGrade, setSortByGrade] = useState(false);
  const [sortByStrokes, setSortByStrokes] = useState(false);
  //selector
  const [selectedKanji, setSelectedKanji] = useState<Kanji[]>([]);
  const [highlightedKanji, setHighlightedKanji] = useState<Kanji[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectorShown, setSelectorShown] = useState(false);
  const [numKanji, setNumKanji] = useState(10);
  const [minStrokes, setMinStrokes] = useState(1);
  const [maxStrokes, setMaxStrokes] = useState(3);
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

  //save kanji to database
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

  //create batches for saving kanji
  const saveBatchesForSavingKanji = async (kanjiBatch: Kanji[]) => {
    for (const kanji of kanjiBatch) {
      try {
        await saveKanji(kanji)       
      } catch (error) {
        console.error(error);
      }
    }
  };

  const createBatchesForSavingKanji = async () => {
    const batchSize = 10; // set the batch size here
    const numBatches = Math.ceil(selectedKanji.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, selectedKanji.length);
      const kanjiBatch = selectedKanji.slice(start, end);
      await saveBatchesForSavingKanji(kanjiBatch);
    }
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
        if (a.freq === null || a.freq === undefined) {
          return 1;
        } else if (b.freq === null || b.freq === undefined) {
          return -1;
        } else {
          return a.freq - b.freq;
        }
      } else if (sortByGrade) {
        if (a.grade === null || a.grade === undefined) {
          return 1;
        } else if (b.grade === null || b.grade === undefined) {
          return -1;
        } else {
          return a.grade - b.grade;
        }
      } else if (sortByStrokes) {
        if (a.strokes === null || a.strokes === undefined) {
          return 1;
        } else if (b.strokes === null || b.strokes === undefined) {
          return -1;
        } else {
          return a.strokes - b.strokes;
        }
      }
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
        .kanji path {
          stroke: black;
          fill: none;
          stroke-width: 2;
        }
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        svg {
          border: 3px solid black;
          margin: 1px; 
        }
        .container {
          width: 90%;
          height: 90%;
          margin: 1%;
        }
      .frontOfCard {
        text-align: center;
        font-size: 1313%;
        }
        .stroke-btn {
          width: 5rem;
          height: 3rem;
        }
        #fun {
          width: 5rem;
        }
        button, #checkbox {
          height: 3rem; 
        }
        .top-btns{
          text-align: center;
          width: 100%;
          margin: 0.25rem;
        }
        .bot-btns{
          text-align: center;
          margin: 0.25rem;
          width: 100%;
        }
      `,
      cardTemplates: [
        {
          Name: "Recognition",
          Front: "<h1 class='frontOfCard'>{{Character}}</h1>",
          Back: `      
          <h2>{{Meaning}}</h2>
          <h3>Kun'yomi: ${kanjiData.readings_kun}</h3>
          <h3>On'yomi: ${kanjiData.readings_on}</h3>
          <div class="container">
          <div class="kanji">            
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
          </div>
          <div class="top-btns">
          <button id="minus" class="stroke-btn"> < </button>
          <button onclick="fun()" id="fun">Draw</button> 
          <button id="plus" class="stroke-btn"> > </button>
          </div>
          <div class="bot-btns">
          <input type="checkbox" id="hardModeCheckbox">
          <label for="hardModeCheckbox">Hard mode</label>
          <button onclick="deleteStrokes()" id="delete-btn">Delete strokes</button>  
          </div>
        <script>
var kanjiVG="${kanjiVGID}",kanjiVG1="#kvg\\\\:"+kanjiVG+" path",paths1=document.querySelectorAll(kanjiVG1),currentPathIndex=-1;function displayPath(){paths1.forEach(((t,e)=>{if(e<=currentPathIndex){t.style.display="block";const e=t.getTotalLength();t.style.strokeDasharray=e,t.style.strokeDashoffset=e,t.style.animation="draw 1s forwards 0.1s"}else t.style.display="none",t.style.strokeDasharray=null,t.style.strokeDashoffset=null,t.style.animation=null}))}displayPath(),document.getElementById("minus").addEventListener("click",(()=>{currentPathIndex>-1&&(currentPathIndex--,displayPath())})),document.getElementById("plus").addEventListener("click",(()=>{currentPathIndex<paths1.length-1&&(currentPathIndex++,displayPath())}));var hardModeCheckbox=document.getElementById("hardModeCheckbox");hardModeCheckbox.addEventListener("change",(function(){if(this.checked){const t=document.querySelectorAll(".text");document.querySelectorAll(".dot").forEach((t=>t.style.display="none")),t.forEach((t=>t.style.display="none"))}else{const t=document.querySelectorAll(".text");document.querySelectorAll(".dot").forEach((t=>t.style.display="block")),t.forEach((t=>t.style.display="block"))}}));kanjiVG1="${kanjiVGID}";var kanjiVG11="#kvg\\\\:"+kanjiVG+" path",paths=document.querySelectorAll(kanjiVG11);function fun(){let t=.3;for(let e=0;e<paths.length;e++){const s=paths[e];s.style.strokeDasharray=null,s.style.strokeDashoffset=null,s.style.animation=null;const a=s.getTotalLength();s.style.strokeDasharray=a,s.style.strokeDashoffset=a,s.style.animation="draw 1s forwards "+t+"s",s.style.display="block",t+=1,currentPathIndex++}}var hue=200;for(let t=0;t<paths.length;t++){paths[t].style.stroke="hsl("+hue+", 100%, 50%)",hue+=25;const e=paths[t].getPointAtLength(0),s=document.createElementNS("http://www.w3.org/2000/svg","text");s.setAttribute("x",e.x),s.setAttribute("y",e.y),s.textContent=t+1,s.setAttribute("font-size","5px"),s.classList.add("text");const a=document.querySelector("svg");a.appendChild(s);const n=document.createElementNS("http://www.w3.org/2000/svg","circle");n.setAttribute("cx",e.x),n.setAttribute("cy",e.y),n.setAttribute("r","1.5"),n.setAttribute("fill","rgba(0,0,0,0.5)"),n.classList.add("dot"),a.appendChild(n)}function deleteStrokes(){paths1.forEach((t=>{t.style.display="none"})),currentPathIndex=-1}
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
          tags: [
            "JLPT:" + kanjiData.jlpt_new + "",
            "NumberofStrokes:" + kanjiData.strokes + "",
            "Radicals:" + kanjiData.wk_radicals + "",
            "Grade:" + kanjiData.grade + "",
            "Frequency:" + kanjiData.freq + ""
          ],
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

  //choose multiple kanji
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
    setHighlightedKanji(selected);
  };

  //create batches of kanji for anki deck creation
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
  
  //visual selector
  const handleDeleteSelected = () => {
    setSelectedKanji<Kanji[]>([])
    setHighlightedKanji<Kanji[]>([]);
  }

  const handleManualSelection = () => {
    setSelectionMode(true)
  }

  const handleCancelManualSelection = () => {
    setSelectionMode(false)
  }

  const handleHighLight = (kanji: Kanji) => {
    if (highlightedKanji.includes(kanji)) {

      setHighlightedKanji(prevHighlightedKanji => prevHighlightedKanji.filter(item => item !== kanji));
      setSelectedKanji(prevSelectedKanji => prevSelectedKanji.filter(item => item !== kanji));
    } else {
      // If it's not, add it to the highlightedKanji array
      setHighlightedKanji(prevHighlightedKanji => [...prevHighlightedKanji, kanji]);
      setSelectedKanji(prevSelectedKanji => [...prevSelectedKanji, kanji])
    }
    
  }

  const handleShowSelector = () => {
    if (selectorShown === true) {
      setSelectorShown(false)
    } else {
      setSelectorShown(true)
    }
  }

  // console.log(selectedKanji)
  // console.log([highlightedKanji])

  return (
      <>

     
        <button onClick={handleShowSelector}>Show selector</button>



        <div className="filters">
          <div>
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
          </div>
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
        </div>

        <div className='group-container'>
          {sortedKanji.map((group) => (
            <div key={group.level}>
              <h2>JLPT Level {group.level}</h2>

                <div id="container">
                  {group.kanji.map((item, index) => (
              
                    <button 
                    key={item.character} 
                    onClick={selectionMode === false ? () => showModal(item) : () => handleHighLight(item)}   
                    className="kanji-button"
                    style={highlightedKanji.includes(item) ? { border: '2px solid white' } : {}}> 
                     <span className="button-text"><h1>{item.character}</h1></span>
                      
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

     {selectorShown && (

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

            {/* onClick={} */}
            <div className='selector-btns'>
              <button onClick={create}>Create Anki deck from selected kanji</button>
              <button onClick={createBatchesForSavingKanji}>Move selected kanji to Learned</button>
              <button onClick={handleGenerateKanji}>Select Kanjis</button>
              <button onClick={handleDeleteSelected}>Cancel selection</button>

              <input 
              type="checkbox" 
              checked={selectionMode} 
              onChange={selectionMode ? handleCancelManualSelection : handleManualSelection} />
              <label>{selectionMode ? "Manual selection is ON" : "Manual selection is OFF"}</label>

            </div>
          </div>
     </div>

     )}   
     

        
    </>
  );
  
};