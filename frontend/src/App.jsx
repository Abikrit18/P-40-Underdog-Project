import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import Dogs from "./Pages/Dogs"; 
import Walk from "./Pages/Walk";
import Adoption from "./Pages/Adoption";
import Donation from './Pages/Donation';
import Login from './Pages/Login';
import Profile from './Pages/Profile';
import Users from './Pages/Users';  
import WalkLog from './Pages/WalkLog';
import WaiverForm from "./Pages/WaiverForm";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dogs" element={<Dogs />} />
            <Route path="/adoption" element={<Adoption />}/>
            <Route path="/walk" element={<Walk />}/>
            <Route path="/donation" element={<Donation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<Users />} />
            <Route path="/walk-logs" element={<WalkLog />} />
            <Route path="/waiver" element={<WaiverForm />} />
          </Routes>
        
        <Footer />
      </div>
    </Router>
  );
};

export default App;