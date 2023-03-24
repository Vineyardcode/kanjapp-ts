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
      kvgPaths(kvgIndex)
    }
  }, [kvgIndex]);

  const kvgPaths = (vgIndex) => {
   
    const strokePaths = document.querySelectorAll(`#kvg\\:${vgIndex} path`);
    
    let hue = 200
    // console.log(strokePaths);

    strokePaths.forEach((path, i) => {
      // create consecutive stroke paths
      path.style.stroke = `hsl( ${hue}, 100%, 50%)`;
      hue += 35;

      const start = path.getPointAtLength(0);
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
    });
  }




  return show ? (
    <div className="modal" onClick={hideModal}>
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
        </div>

        <div className="modal-details">
          <h1>{kanji.character}</h1>
          <p>Meanings: {kanji.meanings.join(", ")}</p>
          <p>Kun'yomi: {kanji.readings_kun || "N/A" }</p> 
          <p>On'yomi: {kanji.readings_on || "N/A" }</p>
          <p>Strokes: {kanji.strokes}</p>
          <button onClick={() => handleSaveKanji(kanji)}>Move to learned</button>
          <button onClick={() => createAnkiCard(kanji, `${kvgIndex}`, strokes)}>Create anki card</button>
          
          <button onClick={hideModal}>Close</button>
        </div>
        


      </div>
    </div>
  ) : null;
  
};

export default Modal;
