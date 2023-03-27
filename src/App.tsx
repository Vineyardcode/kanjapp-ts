import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import  { Home }  from './pages/Home';
import { Login } from "./pages/Login";
import { Navbar } from "./components/navbar";
import './styles/App.css'
import { Learn } from './pages/Learn';
import Test from './pages/Test';



function App() {

  function setBackground() {
    var date = new Date();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var season = "";
  
    if ((month == 2 && day >= 5) || month == 3 || month == 4 || (month == 5 && day <= 6)) {
      season = "spring";
    } else if ((month == 5 && day >= 7) || month == 6 || month == 7 || (month == 8 && day <= 8)) {
      season = "summer";
    } else if ((month == 8 && day >= 9) || month == 9 || month == 10 || (month == 11 && day <= 7)) {
      season = "fall";
    } else {
      season = "winter";
    }
  
    var imageNumber = Math.floor(Math.random() * 5) + 1;
    var backgroundImage = `${season}${imageNumber}.jpg`;
    var element = document.getElementById("background-image");
    element.style.backgroundImage = `url('${backgroundImage}')`;
  }


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
