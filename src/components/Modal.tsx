import React from 'react';
import { useState, useEffect } from 'react';
import KVGindex from "../kanjiData/kvg-index.json"
import '../styles/Modal.css'

interface ModalProps {
  show: boolean;
  kanji: Kanji;
  hideModal: () => void;
  handleSaveKanji: (kanji: Kanji) => void;
  createAnkiCard: (kanjiData: Kanji) => void;
}

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

const Modal: React.FC<ModalProps> = ({ show, kanji, hideModal, handleSaveKanji, createAnkiCard }) => {

  const [strokes, setStrokes] = useState<SVGSVGElement | null>(null);
  const [kvgIndex, setKvgIndex] = useState();

  const [currentPathIndex, setCurrentPathIndex] = useState(-1);

  const fetchData = async (kanji: Kanji) => {

    // look up the kanjiVG index for the given kanji
    const kanjiIndex = KVGindex[kanji].find(index => index.length === 9).slice(0, -4);
    const response2 = await fetch('src/kanjiData/joyo_kanji_vg.xml');
    const xmlString = await response2.text();
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
  
    // look up the kanji svg in the XML file using the kanji VG index
    const kanjiElement = xmlDoc.querySelector(`[id="kvg:${kanjiIndex}"]`);
  
    setStrokes(kanjiElement)
    setKvgIndex(kanjiIndex)
  }

  useEffect(() => {
    if(show){
      fetchData(kanji.character);
      kvgPaths()
    }
    
  }, [kvgIndex]);

  //drawing functions
  const kvgPaths = () => {
    const paths = Array.from(document.querySelectorAll(`#kvg\\:${kvgIndex} path`));
    let hue = 200;
    paths.forEach((path, i) => {
      path.style.stroke = `hsl(${hue + i * 25}, 100%, 50%)`;
      const start = path.getPointAtLength(0);
      const number = document.createElementNS("http://www.w3.org/2000/svg", "text");
      number.setAttribute("x", start.x + Math.floor(Math.random() * 5));
      number.setAttribute("y", start.y);
      number.textContent = i + 1;
      number.setAttribute("font-size", "4.2px");
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
    });
  }

const paths1 = document.querySelectorAll(`#kvg\\:${kvgIndex} path`);


const displayPath = () => {
  let delay = 0.5
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


  useEffect(() => {
    document.getElementById('minus').addEventListener('click', () => {
      if (currentPathIndex > -1) {
        setCurrentPathIndex(currentPathIndex - 1);
        displayPath();
      }
    });

    document.getElementById('plus').addEventListener('click', () => {
      if (currentPathIndex < paths1.length -1) {
        setCurrentPathIndex(currentPathIndex + 1);
        displayPath();
      }
    });
    displayPath();
    console.log(currentPathIndex);
    }, [currentPathIndex])
  



  useEffect(() => {

    

  }, [])
  
  const fun = () => {
    const paths = document.querySelectorAll(`#kvg\\:${kvgIndex} path`)
    let delay = 0.5;
    
    console.log(currentPathIndex);
    
    paths.forEach((path) => {
      
      path.style.strokeDasharray = null;
      path.style.strokeDashoffset = null;
      path.style.animation = null;
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.animation = "draw 1s forwards " + delay + "s";
      path.style.display = 'block';
      delay += 1;
      setCurrentPathIndex(currentPathIndex + 1)
    })
  }


function deleteStrokes() {
  paths1.forEach((path) => {path.style.display = 'none';});
  setCurrentPathIndex(-1)
}

// onClick={hideModal}

  return show ? (
    <div className="modal" >
      <div className="modal-body">

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
            {strokes && <g dangerouslySetInnerHTML={{ __html: strokes.outerHTML }} />}
          </svg>
          <div className="controls">
            <div className="top-btns">
            <button id="minus" className="stroke-btn"> {'<'} </button>
            <button onClick={fun} id="fun">Draw</button> 
            <button id="plus" className="stroke-btn"> {'>'} </button>
            </div>
            <div className="bot-btns">
            <input type="checkbox" id="hardModeCheckbox" />
            <label htmlFor="hardModeCheckbox">Hard mode</label>
            <button onClick={deleteStrokes} id="delete-btn">Delete strokes</button>       
            </div>
          </div>
        </div>

        <div className="modal-details">
          <h1>{kanji.character}</h1>
          <h3>Meanings: {kanji.meanings.join(", ")}</h3>
          <h3>Kun'yomi: {kanji.readings_kun || "N/A" }</h3> 
          <h3>On'yomi: {kanji.readings_on || "N/A" }</h3>
          <h3>Strokes: {kanji.strokes}</h3>
          <button onClick={() => handleSaveKanji(kanji)}><h5>Move to learned</h5></button>
          <button onClick={() => createAnkiCard(kanji, `${kvgIndex}`, strokes)}><h5>Create anki card</h5></button>         
          <button onClick={hideModal}><h5>Close</h5></button>
        </div>
        


      </div>
    </div>
  ) : null;
  
};

export default Modal;
