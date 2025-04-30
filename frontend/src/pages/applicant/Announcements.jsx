// src/pages/applicant/Announcements.js
import React from 'react';
// import AdayLayout from '@/components/common/AdayLayout';
import { useNavigate } from 'react-router-dom';
import AnnouncementTable from '@/components/tables/AnnouncementTable';

export default function Announcements() {
  const navigate = useNavigate();

  const ilanlar = [
    {
      id: 1,
      unvan: "Doçent",
      birim: "Bilgisayar Mühendisliği",
      bolum: "Yapay Zeka",
      tarih: "2025-05-01",
    },
    {
      id: 2,
      unvan: "Profesör",
      birim: "Elektrik-Elektronik Mühendisliği",
      bolum: "Sinyal İşleme",
      tarih: "2025-05-03",
    },
    {
      id: 3,
      unvan: "Dr. Öğr. Üyesi",
      birim: "Endüstri Mühendisliği",
      bolum: "Yalın Üretim",
      tarih: "2025-05-05",
    },
  ];
  // aynı veri

  const handleBasvuru = (id) => {
    navigate(`/aday/basvuru?id=${id}`);
  };

  return (
    // <AdayLayout>
    <>
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Yayındaki Akademik İlanlar</h1>
      <AnnouncementTable ilanlar={ilanlar} onBasvur={handleBasvuru} />
    </>
    // </AdayLayout>
  );
}