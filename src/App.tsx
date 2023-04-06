import React, {useEffect} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import  { Home }  from './pages/Home';
import { Login } from "./pages/Login";
import { Navbar } from "./components/navbar";
import './styles/App.css'
import { Learn } from './pages/Learn';
import Test from './pages/Test';



const App = () => {

  // const setBackground = () => {
  //   let date = new Date();
  //   let month = date.getMonth() + 1;
  //   let day = date.getDate();
  //   let season = "";
  
  //   if ((month == 2 && day >= 5) || month == 3 || month == 4 || (month == 5 && day <= 6)) {
  //     season = "spring";
  //   } else if ((month == 5 && day >= 7) || month == 6 || month == 7 || (month == 8 && day <= 8)) {
  //     season = "summer";
  //   } else if ((month == 8 && day >= 9) || month == 9 || month == 10 || (month == 11 && day <= 7)) {
  //     season = "fall";
  //   } else {
  //     season = "winter";
  //   }
  
  //   let imageNumber = Math.floor(Math.random() * 5) + 1;
  //   let backgroundImage = `${season}${imageNumber}.jpg`;
  //   let element = document.querySelector("body");
  //   let selector = document.querySelector("selector")
  //   element.style.backgroundImage = `url('src/assets/media/img/spring/${backgroundImage}')`;
  //   selector.style.backgroundImage = `url('src/assets/media/img/spring/${backgroundImage}')`;
  //   console.log(backgroundImage);
    
  // }

 
  // useEffect(() => {
  //   setBackground()
  // }, [])
  


  return (
    
    <div className="App">
      
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Learn" element={<Learn />} />
          <Route path="/Test" element={<Test />} />
        </Routes>
      
      </BrowserRouter>
      
      </div>
    
   
  )
}

export default App
