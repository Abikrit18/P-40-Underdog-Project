import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Footer from "./components/Footer";
import Home from "./Pages/Home";
import Dogs from "./Pages/Dogs"; 
import Adoption from "./Pages/Adoption";
=======
import Dogs from "./pages/Dogs";
import Adoption from "./pages/Adoption";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <Router>

      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow container mx-auto mt-4 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dogs" element={<Dogs />} />
            <Route path="/adoption" element={<Adoption />}/>
          </Routes>
        </div>
        <Footer />
=======
      <div className="app-container">
        <Navbar />
        <Routes>
          
          
          <Route path="/dogs" element={<Dogs />} />
          <Route path="/adoption" element={<Adoption />} />
        
        </Routes>

      </div>
    </Router>
  );
};

export default App;



