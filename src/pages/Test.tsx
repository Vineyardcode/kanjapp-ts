import React from 'react'
import { useSelector } from 'react-redux';
import { selectCachedData } from '../store/features/cachedDataSlice';



const Test = () => {
  const cachedData = useSelector(selectCachedData);
  console.log(cachedData.payload.cachedData[0].character)
  
  return (

    <div>

    </div>

  )
}

export default Test



