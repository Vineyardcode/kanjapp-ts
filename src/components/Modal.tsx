import React from 'react'

type ModalProps = {
  modal: Modal
  hideModal: () => void
  handleSaveKanji: () => void
  createAnkiCard: () => void
}
const Modal = ({ modal, handleSaveKanji, createAnkiCard, hideModal }: ModalProps) => {
  return (
      <div>
          <div>Character: {modal.kanji.character}</div>
          <div>Meaning: {modal.kanji.meanings + ''}</div>
          <div>Frequency: {modal.kanji.freq}</div>
          <div>Grade: {modal.kanji.grade}</div>
          <div>JLPT (New): {modal.kanji.jlpt_new}</div>
          <div>Strokes: {modal.kanji.strokes}</div>
          <div>Kunyomi reading: {modal.kanji.readings_kun}</div>
          <button onClick={() => handleSaveKanji(modal.kanji)}>Move to learned</button>
          <button onClick={() => createAnkiCard(modal.kanji)}>Create anki card</button>
          <button onClick={() => hideModal}>Close</button>
      </div>
  )
}

export default Modal