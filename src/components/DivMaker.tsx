import React from 'react';

const DivMaker = ({ count }:Number | any) => {
  const divs = [];

  for (let i = 0; i < count; i++) {
    divs.push(<div key={i}></div>);
  }

  return <>{divs}</>;
}

export default DivMaker;