import React from 'react';
import { Helmet } from "react-helmet";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./screens/Landing.jsx";
import Privacy from "./components/Sections/Privacy.jsx";
import Referrals from "./components/Sections/Referrals.jsx";
import LoginPage from "./components/Pages/LoginPage.jsx";
import SignupPage from "./components/Pages/SignupPage.jsx";
import ResetPasswordPage from "./components/Pages/ResetPasswordPage.jsx";
import AdminRoute from "./components/Routes/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";
import CandidatesList from './components/Sections/CandidatesList.jsx';
import ReferrerCandidatesList from './components/Sections/ReferrerCandidatesList.jsx';
import ReferrerRoute from './components/Routes/ReferrerRoute.jsx';

export default function App() {
  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Khula:wght@400;600;800&display=swap" rel="stylesheet" />
      </Helmet>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Referrals />
              </AdminRoute>
            }/>
            <Route path="/candidateList" element={
              <AdminRoute>
                <CandidatesList />
              </AdminRoute>
            }/>
            <Route path="/signup" element={
              <AdminRoute>
                <SignupPage />
              </AdminRoute>
            }/>
            <Route path="/refCandidList" element={
              <ReferrerRoute>
                <ReferrerCandidatesList />
              </ReferrerRoute>
            }/>
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/reset-password" element={<ResetPasswordPage />}/>
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}
