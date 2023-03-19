import React, { useState, useEffect } from 'react';
import { parseString, XmlDeclarationAttributes } from 'xml2js';
//import kanjiData from '../kanjiData/joyo_kanji_vg.xml'; 

const KanjiSVG = ({ kanji }) => {
  const [svgData, setSvgData] = useState(null);

  useEffect(() => {
    console.log('Reading XML file...');
    parseString('../kanjiData/joyo_kanji_vg.xml', (err, result) => {
      if (err) {
        console.error(err);
        return;
      }
  
      // rest of the code
    });
  }, []);
  

  return (
    <div>
      {/* {svgData && <svg dangerouslySetInnerHTML={{ __html: svgData }} />} */}
    </div>
  );
};

export default KanjiSVG;
