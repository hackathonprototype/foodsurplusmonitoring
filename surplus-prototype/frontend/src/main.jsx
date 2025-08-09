
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Canteen from './pages/Canteen'
import Student from './pages/Student'
import Scan from './pages/Scan'
import './styles.css'

function App(){
  return (
    <BrowserRouter>
      <div className="p-4">
        <nav className="mb-4">
          <Link to="/" className="mr-4">Home</Link>
          <Link to="/canteen" className="mr-4">Canteen</Link>
          <Link to="/student" className="mr-4">Student</Link>
          <Link to="/scan" className="mr-4">Scan QR</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Login/>}/>
          <Route path="/canteen" element={<Canteen/>}/>
          <Route path="/student" element={<Student/>}/>
          <Route path="/scan" element={<Scan/>}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
