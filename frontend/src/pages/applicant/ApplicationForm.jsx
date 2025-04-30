import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import React from 'react';

export default function ApplicationForm() {
  const [params] = useSearchParams();
  const ilanId = params.get('id');

  const [formData, setFormData] = useState({
    baslicaYazar: false,
    atifSayisi: '',
    projeBilgisi: '',
    dosya: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Başvuru gönderildi:", formData);
    alert("Başvuru başarıyla gönderildi!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">
        Başvuru Formu – İlan #{ilanId}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="font-medium">Atıf Sayısı:</label>
          <input
            type="number"
            className="w-full border px-4 py-2 rounded mt-1"
            value={formData.atifSayisi}
            onChange={(e) =>
              setFormData({ ...formData, atifSayisi: e.target.value })
            }
          />
        </div>

        <div>
          <label className="font-medium">Başlıca Yazar mısınız?</label>
          <input
            type="checkbox"
            className="ml-2"
            checked={formData.baslicaYazar}
            onChange={(e) =>
              setFormData({ ...formData, baslicaYazar: e.target.checked })
            }
          />
        </div>

        <div>
          <label className="font-medium">Proje Bilgisi:</label>
          <textarea
            className="w-full border px-4 py-2 rounded mt-1"
            rows="4"
            value={formData.projeBilgisi}
            onChange={(e) =>
              setFormData({ ...formData, projeBilgisi: e.target.value })
            }
          ></textarea>
        </div>

        <div>
          <label className="font-medium">PDF Belgesi Yükle:</label>
          <input
            type="file"
            accept="application/pdf"
            className="w-full border px-2 py-1 mt-1 rounded"
            onChange={(e) =>
              setFormData({ ...formData, dosya: e.target.files[0] })
            }
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Başvuruyu Gönder
        </button>
      </form>
    </div>
  );
}
