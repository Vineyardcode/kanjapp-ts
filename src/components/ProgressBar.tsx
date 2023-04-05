import React from 'react'
import "../styles/ProgressBar.css"


const ProgressBar = ({ percent }) => {

  const style = {
    width: `${percent}%`,
  };

  return (
    <div className="progress-bar" style={style}>
      <div className="progress" style={style}><h5>{percent.toFixed(2)}%</h5></div>
      
    </div>
  );
};

export default ProgressBar