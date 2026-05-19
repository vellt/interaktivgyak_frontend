import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StartPage from './pages/StartPage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import QuestionForm from './pages/QuestionForm';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/questions/new" element={<ProtectedRoute><QuestionForm /></ProtectedRoute>} />
        <Route path="/admin/questions/:id/edit" element={<ProtectedRoute><QuestionForm /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
