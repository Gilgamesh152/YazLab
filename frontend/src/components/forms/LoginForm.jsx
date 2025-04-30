import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function LoginForm({ role, goBack }) {
  const navigate = useNavigate();
  const [tc, setTc] = useState("");
  const [sifre, setSifre] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (role === "aday") navigate("/aday/dashboard");
    else if (role === "akademisyen") navigate("/akademisyen/dashboard");
    else if (role === "yonetici") navigate("/yonetici/dashboard");
  };

  return (
    <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-1">
          T.C. Kimlik No
        </label>
        <input
          type="text"
          value={tc}
          onChange={(e) => setTc(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="11111111111"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Şifre</label>
        <input
          type="password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Giriş Yap
      </button>

      <button
        type="button"
        onClick={goBack}
        className="w-full text-sm text-indigo-500 mt-2 hover:underline"
      >
        Geri Dön
      </button>
    </form>
  );
}


// // src/components/forms/LoginForm.js
// import { useState } from "react";
// import React from 'react';

// const LoginForm = ({ role, goBack }) => {
//   const [tc, setTc] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = () => {
//     // Burada Firebase Auth veya API'ye bağlanılır
//     alert(`${role} olarak giriş yapılıyor: ${tc}`);
//   };

//   return (
//     <div className="w-full max-w-xs space-y-4">
//       <input
//         type="text"
//         placeholder="TC Kimlik No"
//         value={tc}
//         onChange={(e) => setTc(e.target.value)}
//         className="w-full px-4 py-2 border rounded"
//       />
//       <input
//         type="password"
//         placeholder="Şifre"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         className="w-full px-4 py-2 border rounded"
//       />
//       <button
//         onClick={handleLogin}
//         className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
//       >
//         Giriş Yap
//       </button>
//       <button onClick={goBack} className="text-sm text-gray-500 underline block mt-2">
//         Geri dön
//       </button>
//     </div>
//   );
// };

// export default LoginForm;
