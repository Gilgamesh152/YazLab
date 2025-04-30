// src/components/forms/LoginForm.js
import { useState } from "react";
import React from 'react';

const LoginForm = ({ role, goBack }) => {
  const [tc, setTc] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Burada Firebase Auth veya API'ye bağlanılır
    alert(`${role} olarak giriş yapılıyor: ${tc}`);
  };

  return (
    <div className="w-full max-w-xs space-y-4">
      <input
        type="text"
        placeholder="TC Kimlik No"
        value={tc}
        onChange={(e) => setTc(e.target.value)}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Giriş Yap
      </button>
      <button onClick={goBack} className="text-sm text-gray-500 underline block mt-2">
        Geri dön
      </button>
    </div>
  );
};

export default LoginForm;
