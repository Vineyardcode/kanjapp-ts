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
import IconArrowsAlt from '../assets/icons/arrows-alt';
import ProgressBar from '../components/ProgressBar';

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
  const [completed, setCompleted] = useState(0)

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
      body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-content: center;
        text-align: center;
      }
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
      .container {
        flex: 2;
        align-self: center;
        justify-self: center;
        width: 100%;
        height: 100%;
        margin: 1%;
        border: 3px solid black;
      }
      .frontOfCard {
        text-align: center;
        font-size: 1313%;
        }
      .btns {
        display: flex;
        gap: 3px;
        justify-content: center;
        flex-flow: row wrap;
        justify-content: center;
        flex: 2;
        margin: 1rem; 
      }
      .btns button {
        width: 5rem;
        height: 3rem;
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
          <div class="btns">
          <button id="minus" class="stroke-btn"> < </button>
          <button onclick="fun()" id="fun">Draw</button> 
          <button id="plus" class="stroke-btn"> > </button>
          <button id="hardModeCheckbox">Hard mode</button>
          <button onclick="showStrokes()" id="show-btn">Show strokes</button> 
          <button onclick="deleteStrokes()" id="delete-btn">Delete strokes</button>       
          </div>         
      
        <script>
var paths1=document.querySelectorAll("#kvg\\\\:${kanjiVGID} path"),currentPathIndex=-1;function displayPath(){paths1.forEach(((t,e)=>{if(e<=currentPathIndex){t.style.display="block";const e=t.getTotalLength();t.style.strokeDasharray=e,t.style.strokeDashoffset=e,t.style.animation="draw 1s forwards 0.5s"}else t.style.display="none",t.style.strokeDasharray=null,t.style.strokeDashoffset=null,t.style.animation=null}))}displayPath(),document.getElementById("minus").addEventListener("click",(()=>{currentPathIndex>-1&&(currentPathIndex--,displayPath())})),document.getElementById("plus").addEventListener("click",(()=>{currentPathIndex<paths1.length-1&&(currentPathIndex++,displayPath())}));var hardModeCheckbox=document.getElementById("hardModeCheckbox"),clicks=0;hardModeCheckbox.addEventListener("click",(function(){if(0===clicks){hardModeCheckbox.style.border="5px solid rgb(33, 128, 201)";const t=document.querySelectorAll(".text");document.querySelectorAll(".dot").forEach((t=>t.style.display="none")),t.forEach((t=>t.style.display="none")),clicks++}else{hardModeCheckbox.style.border="";const t=document.querySelectorAll(".text"),e=document.querySelectorAll(".dot");clicks--,e.forEach((t=>t.style.display="block")),t.forEach((t=>t.style.display="block"))}}));var kanjiVG="${kanjiVGID}",kanjiVG1="#kvg\\\\:"+kanjiVG+" path",paths=document.querySelectorAll(kanjiVG1);function fun(){let t=.01;for(let e=0;e<paths.length;e++){const s=paths[e];s.style.strokeDasharray=null,s.style.strokeDashoffset=null,s.style.animation=null;const l=s.getTotalLength();s.style.strokeDasharray=l,s.style.strokeDashoffset=l,s.style.animation="draw 1s forwards "+t+"s",s.style.display="block",t+=.42,currentPathIndex++}}var hue=200;for(let t=0;t<paths.length;t++){paths[t].style.stroke="hsl("+hue+", 100%, 50%)",hue+=25;const e=paths[t].getPointAtLength(0),s=document.createElementNS("http://www.w3.org/2000/svg","text");s.setAttribute("x",e.x+3),s.setAttribute("y",e.y),s.textContent=t+1,s.setAttribute("font-size","4.2px"),s.classList.add("text");const l=document.querySelector("svg");l.appendChild(s);const a=document.createElementNS("http://www.w3.org/2000/svg","circle");a.setAttribute("cx",e.x),a.setAttribute("cy",e.y),a.setAttribute("r","1.5"),a.setAttribute("fill","rgba(0,0,0,0.5)"),a.classList.add("dot"),l.appendChild(a)}function deleteStrokes(){paths1.forEach((t=>{t.style.display="none"})),currentPathIndex=-1}function showStrokes(){paths1.forEach((t=>{t.style.display="block",t.style.strokeDasharray=null,t.style.strokeDashoffset=null,t.style.animation=null})),currentPathIndex=paths1.length-1}
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
  const createAnkiDeck = async (kanjiBatch: Kanji[]) => {

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
        setCompleted((completed) => completed+1)
        
      } catch (error) {
        console.error(error);
      }
    }

  }
  
  const createBatches = async () => {
    const batchSize = 50; // set the batch size here
    const numBatches = Math.ceil(selectedKanji.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, selectedKanji.length);
      const kanjiBatch = selectedKanji.slice(start, end);
      await createAnkiDeck(kanjiBatch);
    }
  };
  
  //visual selector
  const handleDeleteSelected = () => {
    setSelectedKanji<Kanji[]>([])
    setHighlightedKanji<Kanji[]>([]);
    setCompleted(0)
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
          </div>

            
            <div className='selector-btns'>
              {completed>0 && <ProgressBar id='progressBar' percent={(completed/selectedKanji.length)*100}/>}
              <button onClick={createBatches}>Create Anki deck from selected kanji</button>
              <button onClick={createBatchesForSavingKanji}>Move selected kanji to Learned</button>
              <button onClick={handleGenerateKanji}>Select Kanjis</button>
              <button onClick={handleDeleteSelected}>Cancel selection</button>
              <button style={selectionMode ? {border: '3px solid black'} : {}} onClick={selectionMode ? handleCancelManualSelection : handleManualSelection}> 
               {selectionMode ? "Manual selection is ON" : "Manual selection is OFF"}</button>
            </div>
          <IconArrowsAlt className='arrowsAlt' onClick={handleShowSelector}/>
        </div>
        
          )}   

      {!selectorShown && (<IconArrowsAlt id='arrowsAlt-outer' onClick={handleShowSelector}/>)}   
     

        
    </>
  );
  
};