//react
import React, {useEffect, useState}from 'react';
//components, pages, styles
import Modal from '../components/Modal';
import AnkiCardPreview from '../components/AnkiCardPreview';
import "../styles/Learn.css"
//supabase-backed learned-kanji sync
import { saveLearnedKanji } from '../lib/learnedKanji';
import { useSyncLearned } from '../hooks/useSyncLearned';
//kanji data
import joyo from "../kanjiData/joyo.json"
import KVGindex from "../kanjiData/kvg-index.json"
//icons
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
  readings_kun?: string[] | string;
  readings_on?: string[] | string;
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewShown, setPreviewShown] = useState(false);
  
  //search bar 
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<any>([]);

  // fetch kanjis and sort them
  const fetchData = async () => {
    try {
      const response = await fetch('/kanjiData/joyo.json');
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

  //when signed in, merge cloud-stored learned kanji into local state
  useSyncLearned(setLearnedKanjiArray);

  //save learned kanji to localStorage + Supabase (when signed in)
  const saveKanji = async (kanji: Kanji) => {
    const updated = await saveLearnedKanji(kanji);
    setLearnedKanjiArray(updated);
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

  // Export the selected kanji as a downloadable Anki .apkg.
  // Replaces the old AnkiConnect integration, which required the add-on, a
  // manual webCorsOriginList edit and a running copy of Anki, and only worked
  // on desktop. The exporter is dynamically imported so its sql.js WASM stays
  // out of the main bundle.
  const handleExportAnki = async () => {
    if (exporting || selectedKanji.length === 0) return;
    setExporting(true);
    setExportError(null);
    setCompleted(0);
    try {
      const { exportKanjiApkg } = await import('../lib/ankiExport');
      await exportKanjiApkg(selectedKanji, (done) => setCompleted(done));
    } catch (err) {
      console.error('Anki export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
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
    setHighlightedKanji(selected);
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
    
    // The open/closed geometry lives in Learn.css under .selector[data-open];
    // setting style.height here could only ever move the height, leaving the
    // padding behind and letting the shut drawer show its contents.
    setSelectorShown((open) => !open);

    
  }

  //search function
  const handleSearchSubmit = (event:any) => {
    event.preventDefault();

    if (/[\u4e00-\u9faf]/.test(query)) { // search for kanji if input is kanji
      const result:any | null = kanji.find((k: any) => k.character === query);
      if (result) {
        
       
        setResults([result]);
      } else {
        setResults(['Kanji not found']);
      }

    } else { // otherwise, search for kanji.meanings
      const result: any | null = kanji.filter((k: any) => k.meanings.includes(query.charAt(0).toUpperCase()+query.slice(1)));
      if (result.length > 0) {
        
        setResults(result);
      } else {
        setResults([`Kanji with a meaning of "${query}" not found`]);
      }
    }
    
  };

  // console.log(results)
  // console.log([highlightedKanji])

  return (
      <>
        <div className="filters">

          
          <div className="search">

            <div className="searchBar">
              <form onSubmit={handleSearchSubmit}>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button type="submit">Search</button>
              </form>
            </div>  
            
              {typeof results[0] !== "string" && modal.show === false && (
              <div className="searchBar-results" style={{ display:typeof results[0] === "string" ? 'none' : 'flex' }}>
                {results.map((item:any, index:any) => (
                  
                  <button 
                    key={item.character} 
                    onClick={selectionMode === false ? () => showModal(item) : () => handleHighLight(item)}   
                    className="kanji-button"
                    data-selected={highlightedKanji.includes(item) || undefined}> 
                    <span className="button-text"><h1>{item.character}</h1></span>
                  </button>

                ))}
              </div>
                )}
             {typeof results[0] === "string" &&  (<h5>{results}</h5>)}
          </div>

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
                      data-selected={highlightedKanji.includes(item) || undefined}> 
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
                  
                />
                
              )}
        </div>
      
        <div className="selector" data-open={selectorShown || undefined} style={{ display: modal.show || previewShown ? 'none' : 'grid' }}>

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

          </div>

          <div className="selector-create-move-manual" >
            <button className='selector-createDeck' onClick={handleExportAnki} disabled={exporting || selectedKanji.length === 0} title={exportError ?? undefined}><h5>{exporting ? 'Building deck...' : exportError ? 'Export failed - retry' : 'Create Anki deck'}</h5></button>
            <button className='selector-previewCard' onClick={() => setPreviewShown(true)} disabled={selectedKanji.length === 0}><h5>Preview card</h5></button>
            <button className='selector-MoveSelectedToLearned' onClick={createBatchesForSavingKanji}><h5>Move to Learned</h5></button>
            <button className='selector-manual' id='manual-btn' data-active={selectionMode || undefined} onClick={selectionMode ? handleCancelManualSelection : handleManualSelection}><h5>{selectionMode ? "Manual selection ON" : "Manual selection OFF"}</h5></button>
          </div>

          <div className="selector-select-progressBar-cancel">

            <button className='selector-select' onClick={handleGenerateKanji}><h5>Select Kanjis</h5></button>
            {completed>0 && (<div className="selector-progressBar"><button style={{width: `${(completed/selectedKanji.length)*100}%`}}><h5>{(completed/selectedKanji.length)*100}%</h5></button></div>)}
            <button className='selector-cancel' id='cancel-btn' onClick={handleDeleteSelected}><h5>Cancel selection</h5></button>
            
          </div>

        </div>
      
        {previewShown && (
          <AnkiCardPreview kanji={selectedKanji} onClose={() => setPreviewShown(false)} />
        )}

        {modal.show===false && previewShown===false && (    
          <div className="hamburger-holder">
            <IconArrowsAlt className='hamburger' onClick={handleShowSelector}/>   
          </div>
          )}
    </>
  );
  
};