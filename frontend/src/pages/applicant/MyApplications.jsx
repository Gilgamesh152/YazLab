// src/pages/applicant/MyApplications.js
import React from 'react';
import ApplicationTable from '@/components/tables/ApplicationTable';

export default function MyApplications() {
  const basvurular = [
    {
      id: 1,
      ilanUnvani: 'Doçent',
      birim: 'Bilgisayar Mühendisliği',
      tarih: '2025-04-15',
      durum: 'Beklemede',
    },
    {
      id: 2,
      ilanUnvani: 'Dr. Öğr. Üyesi',
      birim: 'Elektrik-Elektronik Müh.',
      tarih: '2025-04-10',
      durum: 'Onaylandı',
    },
    {
      id: 3,
      ilanUnvani: 'Profesör',
      birim: 'Endüstri Mühendisliği',
      tarih: '2025-04-05',
      durum: 'Reddedildi',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Başvurularım</h1>
      <ApplicationTable basvurular={basvurular} />
    </div>
  );
}

