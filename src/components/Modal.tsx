import React from 'react'
import { Kanji } from "./pages/Learn";


interface ModalProps {
  show: boolean;
  kanji: Kanji;
  hideModal: () => void;
  handleSaveKanji: (kanji: Kanji) => void;
  createAnkiCard: (kanjiData: Kanji) => void;
}

export const Modal: React.FC<ModalProps> = ({ show, kanji, hideModal, handleSaveKanji, createAnkiCard }) => {
  return show ? (
    <div className="modal">
      <div className="modal-body">

        <div className="modal-body">
          <h3>{kanji.character}</h3>
          <p>Meanings: {kanji.meanings.join(", ")}</p>
          <p>Frequency: {kanji.freq}</p>
          <p>Grade: {kanji.grade}</p>
          <p>JLPT Level: {kanji.jlpt_new || kanji.jlpt_old}</p>
          <p>Category: {kanji.category}</p>
          <p>Strokes: {kanji.strokes}</p>
          
          <button onClick={() => handleSaveKanji(kanji)}>Save kanji</button>
          <button onClick={() => createAnkiCard(kanji)}>Create anki card</button>
          <button onClick={hideModal}>Close</button>
        </div>
      </div>
    </div>
  ) : null;
};


export default Modal