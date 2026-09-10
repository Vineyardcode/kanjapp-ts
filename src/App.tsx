import {BrowserRouter, Route, Routes} from 'react-router-dom'
import  { Home }  from './pages/Home';
import { Login } from "./pages/Login";
import { Navbar } from "./components/navbar";
import './styles/App.css'
import { Learn } from './pages/Learn';
import Test from './pages/Test';
import DivMaker from './components/DivMaker';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {

  return (
    
    <div className="App">
      
      <BrowserRouter>
        <ErrorBoundary>
        <Navbar />

        <Routes>
          <Route path="/" element={<Learn />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/Test" element={<Test />} />
        </Routes>
        </ErrorBoundary>

      </BrowserRouter>

      <div className='background-flag'>
        <div className="flag-grid">
          <DivMaker count={23} />
        </div>
      </div>

    </div>
    
  )
}

export default App
