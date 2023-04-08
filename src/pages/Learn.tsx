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

interface Kanji {
  character?: string;
  meanings?: string[];
  freq?: number;
  grade?: number;
  jlpt_new?: number;
  jlpt_old?: number;
  category?: string;
  strokes?: number;
  readings_kun?: string;
  readings_on?: string;
  wk_radicals?: string;
}

export const Learn = () => {

  //info management
  const [kanji, setKanji] = useState(joyo); 
  const [modal, setModal] = useState({ show: false, kanji: {} })
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);
  const [selectedLevels, setSelectedLevels] = useState([5]);

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
  
  // fetch kanjis and sort them
  const fetchData = async () => {
    try {
      const response = await fetch('src/kanjiData/joyo.json');
      const json = await response.json();
      setKanji(json.sort((a: Kanji, b: Kanji) => {
        const freqA = a.freq ?? Infinity;
        const freqB = b.freq ?? Infinity;
        const strokesA = a.strokes ?? 0;
        const strokesB = b.strokes ?? 0;
      
        if (freqA !== freqB) {
          return freqA - freqB;
        }
      
        return strokesA - strokesB;
      }));
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
    let learnedKanjiArray = JSON.parse(localStorage.getItem("learnedKanjiArray") || "[]");
    if (!learnedKanjiArray.some((k: Kanji) => k.character === kanji.character)) {
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
  const handleLevelSelection = (e: any) => {
    const level = Number(e.target.value);
    const index = selectedLevels.indexOf(level);

    if (index === -1) {
      setSelectedLevels([...selectedLevels, level]);
      
    } else {
      setSelectedLevels(selectedLevels.filter((l) => l !== level));
    }
    
  };

  // create anki flash cards out of selected kanji
  const createAnkiCard = (kanjiData: Kanji, kanjiVGID: any, svgPaths: any) => {
    

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
        var kanjiVG = "${kanjiVGID}"
        var kanjiVG1 = "#kvg\\\\:" + kanjiVG + " path"
        var paths1 = document.querySelectorAll(kanjiVG1);
var currentPathIndex = -1;
function displayPath() {
let delay = 0.1
paths1.forEach((path, index) => {
  if (index <= currentPathIndex) {
    path.style.display = 'block';
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.animation = "draw 1s forwards " + delay + "s";
  } else {
    path.style.display = 'none';
    path.style.strokeDasharray = null;
    path.style.strokeDashoffset = null;
    path.style.animation = null;
  }
});
}
displayPath();
document.getElementById('minus').addEventListener('click', () => {
if (currentPathIndex > -1) {
  currentPathIndex--;
  displayPath();
}
});
document.getElementById('plus').addEventListener('click', () => {
if (currentPathIndex < paths1.length -1) {
  currentPathIndex++;
  displayPath();
}
});
var hardModeCheckbox = document.getElementById("hardModeCheckbox");
hardModeCheckbox.addEventListener('change', function() {
if (this.checked) {
  const text = document.querySelectorAll('.text');
  const dot = document.querySelectorAll('.dot'); 
  dot.forEach((dot) => (dot.style.display = 'none'));
  text.forEach((text) => (text.style.display = 'none'));
} else {
  const text = document.querySelectorAll('.text');
  const dot = document.querySelectorAll('.dot'); 
  dot.forEach((dot) => (dot.style.display = 'block'));
  text.forEach((text) => (text.style.display = 'block'));
}
});
var kanjiVG1 = "${kanjiVGID}";
var kanjiVG11 = "#kvg\\\\:" + kanjiVG + " path";
var paths = document.querySelectorAll(kanjiVG11);
function fun() {
let delay = 0.3;
for (let i = 0; i < paths.length; i++) {
  const path = paths[i];
  path.style.strokeDasharray = null;
  path.style.strokeDashoffset = null;
  path.style.animation = null;
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  path.style.animation = "draw 1s forwards " + delay + "s";
  path.style.display = 'block';
  delay += 1;
  currentPathIndex++
}
}
var hue = 200;
for (let i = 0; i < paths.length; i++) {
  paths[i].style.stroke = "hsl(" + hue + ", 100%, 50%)";
  hue += 25;
  const start = paths[i].getPointAtLength(0);
  const number = document.createElementNS("http://www.w3.org/2000/svg", "text");
  number.setAttribute("x", start.x);
  number.setAttribute("y", start.y);
  number.textContent = i + 1;
  number.setAttribute("font-size", "5px");
  number.classList.add("text");
  const strokesSVG = document.querySelector('svg');
  strokesSVG.appendChild(number);
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", start.x);
  dot.setAttribute("cy", start.y);
  dot.setAttribute("r", "1.5");
  dot.setAttribute("fill", "rgba(0,0,0,0.5)");
  dot.classList.add("dot");
  strokesSVG.appendChild(dot);
}
function deleteStrokes() {
  paths1.forEach((path) => {path.style.display = 'none';});
currentPathIndex = -1
}
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
            Meaning: kanjiData.meanings?.join(", "),  
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
  const createAnkiDeck = async (kanjiBatch: any) => {

    for (const kanji of kanjiBatch) {
      try {
        // look up the kanjiVG index for the given kanji
        const kanjiVGindex:any = KVGindex
        const kanjiIndex = kanjiVGindex[kanji. character].find((index: any) => index.length === 9).slice(0, -4);
        const response2 = await fetch('/KVGs/joyo_kanji_vg.xml');
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
    setSelectedKanji([])
    setHighlightedKanji([]);
    setCompleted(0)
    setSelectionMode(false)
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

    setSelectionMode(false)
    setSelectedKanji([])
    setHighlightedKanji([]);
    setCompleted(0)
    
    const selector = document.querySelector(".selector")
   

    if (selector instanceof HTMLElement) {
      if (selectorShown === false) {
        selector.style.height = "16%";
        setSelectorShown(true);
      } else {
        selector.style.height = "0";
        setSelectorShown(false);
      }
    }

    
  }

  // console.log(selectedKanji)
  // console.log([highlightedKanji])

  return (
      <>
        <div className="filters">
          {/* <div className='sorting'>
            <h3>Sort</h3>
                <label>
                    <input type="checkbox" checked={sortByFreq} onChange={handleSortByFreqChange} />
                    <h5>By frequency</h5>
                  </label>
                  <label>
                    <input type="checkbox" checked={sortByGrade} onChange={handleSortByGradeChange} />
                    <h5>By grade</h5>
                  </label>
                  <label>
                    <input type="checkbox" checked={sortByStrokes} onChange={handleSortByStrokesChange} />
                    <h5>By strokes</h5>
                </label>
          </div> */}
          <div className='levels'>
            <h3>Select JLPT levels:</h3>
            {[5, 4, 3, 2, 1].map((level) => (
              <label key={level}>
                <input
                  type="checkbox"
                  value={level}
                  checked={selectedLevels.includes(level)}
                  onChange={handleLevelSelection}
                />
                <h5>N{level}</h5>
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
                      style={highlightedKanji.includes(item) ? { border: '1px solid black' } : {}}> 
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
      

      {modal.show===false && (
      
        <div className="selector">

          <div className="params">
            <div>
              <label htmlFor="numKanji"><h5>Kanjis</h5></label>
              <input
              type="number"
              name="numKanji"
              value={numKanji}
              onChange={(e) => setNumKanji(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="minStrokes"><h5>Min strokes</h5></label>
              <input
                type="number"
                name="minStrokes"
                value={minStrokes}
                onChange={(e) => setMinStrokes(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="maxStrokes"><h5>Max strokes</h5></label>
              <input
                type="number"
                name="maxStrokes"
                value={maxStrokes}
                onChange={(e) => setMaxStrokes(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="jlptLevel"><h5>JLPT level</h5></label>
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
            {/* <div>
              <label htmlFor="minGrade">Min grade:</label>
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
            </div> */}
          </div>

          <div className="selector-create-move-manual" >
            <button className='selector-createDeck' onClick={createBatches}><h5>Create Anki deck</h5></button>
            <button className='selector-MoveSelectedToLearned' onClick={createBatchesForSavingKanji}><h5>Move to Learned</h5></button>
            <button className='selector-manual' id='manual-btn' style={selectionMode ? {border: '3px solid black'} : {}} onClick={selectionMode ? handleCancelManualSelection : handleManualSelection}><h5>{selectionMode ? "Manual selection ON" : "Manual selection OFF"}</h5></button>
          </div>

          <div className="selector-select-progressBar-cancel">

            <button className='selector-select' onClick={handleGenerateKanji}><h5>Select Kanjis</h5></button>
            {completed>0 && (<div className="selector-progressBar"><button style={{width: `${(completed/selectedKanji.length)*100}%`}}><h5>{(completed/selectedKanji.length)*100}%</h5></button></div>)}
            <button className='selector-cancel' id='cancel-btn' onClick={handleDeleteSelected}><h5>Cancel selection</h5></button>
            
          </div>

        </div>
      
        )}   

      {modal.show===false && (    
        <div className="hamburger-holder">
          {modal.show===false && (<IconArrowsAlt className='hamburger' onClick={handleShowSelector}/>)}   
        </div>
        )}
    </>
  );
  
};