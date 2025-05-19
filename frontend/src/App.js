import React from 'react';
import { Helmet } from "react-helmet";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./screens/Landing.jsx";
import Privacy from "./components/Sections/Privacy.jsx";
import AdminPanel from "./components/Sections/AdminPanel.jsx";
import LoginPage from "./components/Pages/LoginPage.jsx";
import SignupPage from "./components/Pages/SignupPage.jsx";
import ResetPasswordPage from "./components/Pages/ResetPasswordPage.jsx";
import AdminRoute from "./components/Routes/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";
import CandidatesList from './components/Sections/CandidatesList.jsx';
import ReferrerCandidatesList from './components/Sections/ReferrerCandidatesList.jsx';
import ReferrerRoute from './components/Routes/ReferrerRoute.jsx';
import AddCandidate from './components/Sections/AddCandidate.jsx'
import StudentSignUp from './student-pages/StudentSignUp.jsx';
import StudentLogin from './student-pages/StudentLogin.jsx';
import QuizPage from './components/Sections/QuizPage.jsx';
import AdminReport from './components/Sections/AdminReport.jsx';
import StudentRoute from './components/Routes/StudentRoute.jsx';
import DashboardPage from './components/Sections/DashboardPage.jsx';
import EmpDashboard from './components/Sections/EmpDashboard.jsx';
import StudentDashboard from './components/Sections/StudentDashboard.jsx'

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
                <AdminPanel />
              </AdminRoute>
            }/>
            <Route path="/candidateList" element={
              <AdminRoute>
                <CandidatesList />
              </AdminRoute>
            }/>
            <Route path="/add-candidate" element={
              <AdminRoute>
                <AddCandidate />
              </AdminRoute>
            }/>
            <Route path="/signup" element={
              <AdminRoute>
                <SignupPage />
              </AdminRoute>
            }/>
            <Route path="/admin-report" element={
              <AdminRoute>
                <AdminReport />
              </AdminRoute>
            }/>
            <Route path="/refCandidList" element={
              <ReferrerRoute>
                <ReferrerCandidatesList />
              </ReferrerRoute>
            }/>
            
            {/* Student Protected Route */}
            <Route path="/Quiz" element={
              <StudentRoute>
                <QuizPage />
              </StudentRoute>
            }/>
            {/* Student Protected Route */}
            <Route path="/StudentDashboard" element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            }/>
            
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/reset-password" element={<ResetPasswordPage />}/>
            <Route path="/s-signUpPage" element={<StudentSignUp />}/>
            <Route path="/s-loginPage" element={<StudentLogin />}/>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/EmpDashboard" element={<EmpDashboard />} />
            {/* <Route path="/StudentDashboard" element={<StudentDashboard/>}/> */}
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}
