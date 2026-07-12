import React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import KVGindex  from "../kanjiData/kvg-index.json"
import Kanji3D, { Kanji3DHandle } from './Kanji3D';
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
  const [kvgIndexes] = useState<any>(KVGindex);
  const [kvgIndex, setKvgIndex] = useState<any>();

  const kanji3DRef = useRef<Kanji3DHandle>(null);

  const fetchData = async (kanji: any) => {
    // look up the kanjiVG index for the given kanji
    const kanjiVGindex:any = kvgIndexes[kanji].find((index: any) => index.length === 9).slice(0, -4);

    const response2 = await fetch('/kanjiData/joyo_kanji_vg.xml');
    const xmlString = await response2.text();
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
    // look up the kanji svg in the XML file using the kanji VG index
    const kanjiElement = xmlDoc.querySelector(`[id="kvg:${kanjiVGindex}"]`);

    setKvgIndex(kanjiVGindex)
    setStrokes(kanjiElement)
  };

  useEffect(() => {
    if (show && kanji.character) {
      fetchData(kanji.character);
    }
  }, [show, kanji.character]);

  // Extract the ordered stroke "d" strings to feed the 3D renderer.
  const strokeDs = useMemo<string[]>(() => {
    if (!strokes) return [];
    return Array.from(strokes.getElementsByTagName('path'))
      .map((p: any) => p.getAttribute('d') || '')
      .filter((d: string) => d.length > 0);
  }, [strokes]);

  return show ? (
    <div className="modal" >
      <div className="modal-body">

        <div className="kanji">
          <Kanji3D ref={kanji3DRef} strokes={strokeDs} />
        </div>

        <div className="controls">

          <button onClick={() => kanji3DRef.current?.prev()} className='row-btn'><h5>{'Prev'}</h5></button>

          <div className="ctrls-column">
            <button onClick={() => kanji3DRef.current?.play()} id='draw-btn'><h5>Draw</h5></button>
            <button onClick={() => kanji3DRef.current?.erase()} id="delete-btn"><h5>Erase</h5></button>
          </div>

          <button onClick={() => kanji3DRef.current?.next()} className='row-btn'><h5>{'Next'}</h5></button>

          <div className="ctrls-column">
            <button onClick={() => kanji3DRef.current?.toggleRotate()}><h5>{'Rotate'}</h5></button>
            <button onClick={() => handleSaveKanji(kanji)}><h5>{'Move to learned'}</h5></button>
          </div>

          <div className="ctrls-column">
            <button onClick={() => createAnkiCard(kanji, `${kvgIndex}`, strokes)}><h5>Create anki card</h5></button>
            <button onClick={hideModal}><h5>Close</h5></button>
          </div>

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
