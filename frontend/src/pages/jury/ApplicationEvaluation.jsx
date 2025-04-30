import React from "react";
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ApplicationEvaluation() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('id'); // Örn: ?id=1

  const [puan, setPuan] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const aday = {
    adSoyad: 'Ali Yılmaz',
    unvan: 'Doçent',
    bolum: 'Bilgisayar Mühendisliği',
    tarih: '2025-04-20',
    belgeler: ['Özgeçmiş.pdf', 'YayınListesi.pdf', 'Tablo5.pdf'],
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!puan || isNaN(puan)) {
      alert('Lütfen geçerli bir puan giriniz.');
      return;
    }
    setSubmitted(true);
    // Burada değerlendirme gönderme işlemi yapılır (API vs.)
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Başvuru Değerlendirmesi</h1>

      <div className="bg-white border rounded shadow p-4 mb-6">
        <p><strong>Aday:</strong> {aday.adSoyad}</p>
        <p><strong>Unvan:</strong> {aday.unvan}</p>
        <p><strong>Bölüm:</strong> {aday.bolum}</p>
        <p><strong>Başvuru Tarihi:</strong> {aday.tarih}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-indigo-600 mb-2">Belgeler</h2>
        <ul className="list-disc list-inside">
          {aday.belgeler.map((belge, i) => (
            <li key={i} className="text-sm text-gray-700">{belge}</li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Puan (0-100):</label>
          <input
            type="number"
            value={puan}
            onChange={(e) => setPuan(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Açıklama:</label>
          <textarea
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            rows="4"
            className="w-full px-4 py-2 border rounded"
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Değerlendirmeyi Gönder
        </button>

        {submitted && (
          <p className="text-green-700 font-semibold mt-4">
            Değerlendirmeniz başarıyla gönderildi.
          </p>
        )}
      </form>
    </div>
  );
}
