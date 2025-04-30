// src/pages/auth/Login.js
import { useState } from "react";
import LoginForm from "../../components/forms/LoginForm";
import uniImage from "../../assests/images/universite.jpg"; // görseli sen koymalısın
import React from 'react';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Sol görsel */}
      <div
        className="w-1/2 bg-cover bg-center hidden md:block"
        style={{ backgroundImage: `url(${uniImage})` }}
      ></div>

      {/* Sağ içerik */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8">
        <h2 className="text-3xl font-bold mb-6 text-indigo-700">
          Akademik Başvuru Sistemi
        </h2>

        {!selectedRole ? (
          <div className="space-y-4 w-full max-w-xs">
            <button
              onClick={() => setSelectedRole("aday")}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Aday Girişi
            </button>
            <button
              onClick={() => setSelectedRole("akademisyen")}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Akademisyen Girişi
            </button>
            <button
              onClick={() => setSelectedRole("yonetici")}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Yönetici Girişi
            </button>
          </div>
        ) : (
          <LoginForm role={selectedRole} goBack={() => setSelectedRole(null)} />
        )}
      </div>
    </div>
  );
};

export default Login;
