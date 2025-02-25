import React from "react";
import { Helmet } from "react-helmet";
// Screens
import Landing from "./screens/Landing.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Privacy from "./components/Sections/Privacy.jsx";
import Referrals from "./components/Sections/Referrals.jsx";


export default function App() {
  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Khula:wght@400;600;800&display=swap" rel="stylesheet" />
      </Helmet>
      <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin"element={<Referrals />}/>
      </Routes>
    </Router>
    </>
  );
}

