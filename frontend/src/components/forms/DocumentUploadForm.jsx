import React from "react";
import { useState } from 'react';

export default function DocumentUploadForm({ onBelgeEkle }) {
  const [belgeTuru, setBelgeTuru] = useState('');
  const [dosya, setDosya] = useState(null);

  const belgeTurleri = [
    'Özgeçmiş',
    'Lisans Diploması',
    'Yüksek Lisans Diploması',
    'Yayın Listesi',
    'Projeler',
    'Katılım Belgeleri',
    'Diğer'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!belgeTuru || !dosya) {
      alert('Lütfen belge türü ve dosya seçin.');
      return;
    }

    onBelgeEkle({
      id: Date.now(),
      belgeTuru,
      dosyaAdi: dosya.name,
      tarih: new Date().toLocaleDateString('tr-TR')
    });

    setBelgeTuru('');
    setDosya(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="font-medium">Belge Türü:</label>
        <select
          value={belgeTuru}
          onChange={(e) => setBelgeTuru(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded"
        >
          <option value="">-- Seçiniz --</option>
          {belgeTurleri.map((tur) => (
            <option key={tur} value={tur}>{tur}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-medium">PDF Dosyası:</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setDosya(e.target.files[0])}
          className="w-full mt-1 px-3 py-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        Yükle
      </button>
    </form>
  );
}
