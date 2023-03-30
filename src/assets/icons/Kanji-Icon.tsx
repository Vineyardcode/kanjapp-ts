import React from 'react';

interface Props {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}



const KanjiIcon: React.FC<Props> = ({ width = 24, height = 24, color = '#000000', className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width='1024'
    height='1024'
    viewBox="0 0 1024 1024"

  >
    <path stroke='white' d="M18.757 2.243c-.39-.39-1.024-.39-1.414 0l-8.485 8.485-8.485-8.485c-.39-.39-1.024-.39-1.414 0s-.39 1.024 0 1.414l8.485 8.485-8.485 8.485c-.39.39-.39 1.024 0 1.414.195.195.45.293.707.293s.512-.098.707-.293l8.485-8.485 8.485 8.485c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.024 0-1.414l-8.485-8.485 8.485-8.485c.39-.39.39-1.024 0-1.414z"/>
  </svg>
);

export default KanjiIcon;