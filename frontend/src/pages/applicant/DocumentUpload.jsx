// src/pages/applicant/DocumentUpload.js
import React from 'react';
import { useState } from 'react';
import DocumentUploadForm from '@/components/forms/DocumentUploadForm';

export default function DocumentUpload() {
  const [yuklenenBelgeler, setYuklenenBelgeler] = useState([]);

  const handleBelgeEkle = (yeniBelge) => {
    setYuklenenBelgeler([...yuklenenBelgeler, yeniBelge]);
  };

  const handleSil = (id) => {
    setYuklenenBelgeler(yuklenenBelgeler.filter((b) => b.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Belge Yükleme</h1>

      <DocumentUploadForm onBelgeEkle={handleBelgeEkle} />

      {yuklenenBelgeler.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2 text-indigo-600">Yüklenen Belgeler</h2>
          <ul className="divide-y border rounded bg-white shadow">
            {yuklenenBelgeler.map((b) => (
              <li key={b.id} className="p-3 text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{b.belgeTuru}</p>
                  <p className="text-gray-500">{b.dosyaAdi}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400">{b.tarih}</span>
                  <button
                    onClick={() => handleSil(b.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
