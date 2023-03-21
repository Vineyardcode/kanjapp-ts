import React, { useState, useEffect } from 'react';

import šudliky from "../kanjiData/kvg-index.json"
interface Kanji {
  character?: string;
  meanings?: string[];
  freq?: number;
  grade?: number;
  jlpt_new?: number;
  jlpt_old?: number;
  category?: string;
  strokes?: number;
  kanji?: string;
}

const StrokeOrder = ({kanji}: Kanji) => {

  const [strokes, setStrokes] = useState<SVGSVGElement | null>(null);
  
  useEffect(() => {
    const fetchData = async (kanji: Kanji) => {

        // look up the kanjiVG index for the given kanji
        const kanjiIndex = šudliky[kanji].find(index => index.length === 9).slice(0, -4);
        const response2 = await fetch('src/kanjiData/joyo_kanji_vg.xml');
        const xmlString = await response2.text();
        const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
      
        // look up the kanji svg in the XML file using the kanji VG index
        const kanjiElement = xmlDoc.querySelector(`[id="kvg:${kanjiIndex}"]`);
      
        
        setStrokes(kanjiElement)
      }

    fetchData(kanji);
  }, [kanji]);

  return (
    <div className="kanji">
      <svg
        width="100"
        height="100"
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
  );
};

export default StrokeOrder;
