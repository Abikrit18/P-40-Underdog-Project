import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dogs from "./pages/Dogs";
import Adoption from "./pages/Adoption";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <Router>
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
