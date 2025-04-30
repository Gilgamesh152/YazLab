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


export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />

        {/* Aday Paneli */}
        {/* <Route path="/aday/dashboard" element={<AdayDashboard />} />
        <Route path="/aday/ilanlar" element={<Announcements />} />
        <Route path="/aday/basvuru" element={<ApplicationForm />} />
        <Route path="/aday/basvurularim" element={<MyApplications />} />
        <Route path="/aday/belge-yukle" element={<DocumentUpload />} />
        <Route path="/aday/durum" element={<ApplicationStatus />} /> */}

        <Route path="/aday" element={<AdayLayout />}>
          <Route path="dashboard" element={<AdayDashboard />} />
          <Route path="ilanlar" element={<Announcements />} />
          <Route path="basvuru" element={<ApplicationForm />} />
          <Route path="basvurularim" element={<MyApplications />} />
          <Route path="belge-yukle" element={<DocumentUpload />} />
          <Route path="durum" element={<ApplicationStatus />} />
        </Route>
      </Routes>
    </Router>
  );
}
