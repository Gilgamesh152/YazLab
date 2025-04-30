// src/routes/Routes.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import React from 'react';
import AdayLayout from '@/components/common/AdayLayout';

// 🎓 Aday Paneli Sayfaları
import AdayDashboard from '@/pages/applicant/Dashboard';
import Announcements from '@/pages/applicant/Announcements';
import ApplicationForm from '@/pages/applicant/ApplicationForm';
import MyApplications from '@/pages/applicant/MyApplications';
import DocumentUpload from '@/pages/applicant/DocumentUpload';
import ApplicationStatus from '@/pages/applicant/ApplicationStatus';

// 🎓 Jüri Paneli Sayfaları
import JuryDashboard from '@/pages/jury/Dashboard';
import ApplicationEvaluation from '@/pages/jury/ApplicationEvaluation';
import JuriLayout from '@/components/common/JuriLayout';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />

        {/* Aday Paneli */}
        <Route path="/aday" element={<AdayLayout />}>
          <Route path="dashboard" element={<AdayDashboard />} />
          <Route path="ilanlar" element={<Announcements />} />
          <Route path="basvuru" element={<ApplicationForm />} />
          <Route path="basvurularim" element={<MyApplications />} />
          <Route path="belge-yukle" element={<DocumentUpload />} />
          <Route path="durum" element={<ApplicationStatus />} />
        </Route>

        {/* Jüri Paneli */}
        <Route path="/akademisyen" element={<JuriLayout />}>
          <Route path="dashboard" element={<JuryDashboard />} />
          <Route path="degerlendirme" element={<ApplicationEvaluation />} />
        </Route>

      </Routes>
    </Router>
  );
}
