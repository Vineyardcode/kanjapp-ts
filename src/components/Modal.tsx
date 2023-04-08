import React from 'react';
import { useState, useEffect } from 'react';
import KVGindex  from "../kanjiData/kvg-index.json"
import '../styles/Modal.css'

interface ModalProps {
  show: boolean;
  kanji: Kanji;
  hideModal: any;
  handleSaveKanji: any;
  createAnkiCard: any;
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
  readings_kun?: string;
  readings_on?: string;
  wk_radicals?: string;
}

const Modal: React.FC<ModalProps> = ({ show, kanji, hideModal, handleSaveKanji, createAnkiCard }) => {



  const [strokes, setStrokes] = useState<any>(null);
  const [kvgIndexes, setKvgIndexes] = useState<any>(KVGindex);
  const [kvgIndex, setKvgIndex] = useState<any>();

  const [currentPathIndex, setCurrentPathIndex] = useState<any>(-1);

  const fetchData = async (kanji: any) => {
    // look up the kanjiVG index for the given kanji
    const kanjiVGindex:any = kvgIndexes[kanji].find((index: any) => index.length === 9).slice(0, -4);
    

    const response2 = await fetch('/KVGs/joyo_kanji_vg.xml');
    const xmlString = await response2.text();
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
    // look up the kanji svg in the XML file using the kanji VG index
    const kanjiElement = xmlDoc.querySelector(`[id="kvg:${kanjiVGindex}"]`);
    console.log(kanjiElement);
    
    setKvgIndex(kanjiVGindex)
    setStrokes(kanjiElement)
  };

  useEffect(() => {

    if(show){
      fetchData(kanji.character);
      kvgPaths();
      setCurrentPathIndex(document.querySelectorAll(`#kvg\\:${kvgIndex} path`).length);
    }
    
  }, [kvgIndex]);

  //drawing functions
  const kvgPaths = () => {
    const paths: SVGPathElement[] = Array.from(document.querySelectorAll(`#kvg\\:${kvgIndex} path`));
    let hue = 200;
    
    paths.forEach((path, i: any) => {
      path.style.stroke = `hsl(${hue + i * 25}, 100%, 50%)`;
      const start = path.getPointAtLength(0);
      const number = document.createElementNS("http://www.w3.org/2000/svg", "text");
      number.setAttribute("x", (start.x).toString());
      number.setAttribute("y", (start.y).toString());
      number.textContent = i + 1;
      number.setAttribute("font-size", "4.2px");
      number.classList.add("text");
      const strokesSVG = document.querySelector('svg');
      
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", (start.x).toString());
      dot.setAttribute("cy", (start.y).toString());
      dot.setAttribute("r", "1.5");
      dot.setAttribute("fill", "rgba(0,0,0,0.5)");
      dot.classList.add("dot");
      if (strokesSVG) {
        strokesSVG.appendChild(number);
        strokesSVG.appendChild(dot);
      }
      
    });
  };

  const handleMinusClick = () => {
    const paths: SVGPathElement[] = Array.from(document.querySelectorAll(`#kvg\\:${kvgIndex} path`));

    if (currentPathIndex > 0) {
      paths[currentPathIndex-1].style.display = 'none';
      paths[currentPathIndex-1].style.strokeDasharray = "";
      paths[currentPathIndex-1].style.strokeDashoffset = "";
      paths[currentPathIndex-1].style.animation = "";
      setCurrentPathIndex(currentPathIndex - 1);
    } else {
      setCurrentPathIndex(0)
    }
  };

  const handlePlusClick = () => {
    const paths: SVGPathElement[] = Array.from(document.querySelectorAll(`#kvg\\:${kvgIndex} path`));

    if (currentPathIndex <= paths.length-1) {
      paths[currentPathIndex].style.display = 'block';
      const length = paths[currentPathIndex].getTotalLength();
      paths[currentPathIndex].style.strokeDasharray = length.toString();
      paths[currentPathIndex].style.strokeDashoffset = length.toString();
      paths[currentPathIndex].style.animation = "draw 1s forwards 0.3s";
      setCurrentPathIndex(currentPathIndex + 1)
    } else {
      setCurrentPathIndex(paths.length)
    }
  };
  
  const draw = () => {
    const paths: SVGPathElement[] = Array.from(document.querySelectorAll(`#kvg\\:${kvgIndex} path`));
    let delay = 0.5;
      
    for (let i = 0; i < paths.length; i++) {
      paths[i].style.strokeDasharray = "";
      paths[i].style.strokeDashoffset = "";
      paths[i].style.animation = "";
      paths[i].style.display = 'block';
      const length = paths[i].getTotalLength();
      paths[i].style.strokeDasharray = length.toString();
      paths[i].style.strokeDashoffset = length.toString();
      paths[i].style.animation = "draw 1s forwards " + delay + "s";
      delay += 1 
    }
    setCurrentPathIndex(paths.length)
  };

  const deleteStrokes = () => {
    const paths: NodeListOf<SVGPathElement> = document.querySelectorAll(`#kvg\\:${kvgIndex} path`)
    paths.forEach((path) => {path.style.display = 'none';});
    setCurrentPathIndex(0)
  }
  
  return show ? (
    <div className="modal" >
      <div className="modal-body">

        <div className="kanji">
          <svg
            viewBox="0 0 100 100"
            width="100%" height="100%"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            xmlSpace="preserve"
            version="1.1"
            baseProfile="full"
          >
           
            {strokes && <g dangerouslySetInnerHTML={{ __html: strokes.outerHTML }} />}
          </svg>
        </div>

        <div className="controls">

          <button onClick={handleMinusClick} className='row-btn'><h5>{'Prev'}</h5></button>
          
          <div className="ctrls-column">
            <button onClick={draw} id='draw-btn'><h5>Draw</h5></button>    
            <button onClick={deleteStrokes} id="delete-btn"><h5>Erase</h5></button>       
          </div>

          <button onClick={handlePlusClick} className='row-btn'><h5>{'Next'}</h5></button>
          
          <div className="ctrls-column">
            <button onClick={() => handleSaveKanji(kanji)}><h5>{'Move to learned'}</h5></button>
            <button onClick={() => createAnkiCard(kanji, `${kvgIndex}`, strokes)}><h5>Create anki card</h5></button>         
          </div>
          
          <button onClick={hideModal} className='row-btn'><h5>Close</h5></button>
          
        </div>

        <div className="modal-details">

          <div className='left-column'>
            <div id='meanings'><h5>Meanings: {kanji.meanings?.join(", ")}</h5></div>
            <div><h5>Strokes: {kanji.strokes}</h5></div> 
          </div>

          <div className="mid-column">
            <h1>{kanji.character}</h1>
          </div>

          <div className="right-column">
            <div><h5>On'yomi: {kanji.readings_on || "N/A" }</h5></div>
            <div><h5>Kun'yomi: {kanji.readings_kun || "N/A" }</h5></div>
          </div>

        </div>

      </div>
    </div>
  ) : null;
  
};

export default Modal;
