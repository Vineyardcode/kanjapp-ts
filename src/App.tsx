import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import  { Home }  from './pages/Home';
import { Login } from "./pages/Login";
import { Navbar } from "./components/navbar";
import './styles/App.css'
import { Learn } from './pages/Learn';
import Test from './pages/Test';



function App() {

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
