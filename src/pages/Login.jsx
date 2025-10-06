import React, { useState } from "react";
import { ENDPOINTS } from "../services/endpoints";
import { setAccess } from "../services/auth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
        }),
        credentials: "include", // важно, чтобы refresh-cookie сохранился
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("Ошибка входа:", text);
        throw new Error("Неверный логин или пароль");
      }

      const data = await response.json();
      console.log("✅ Успешный вход:", data);

      // сохраняем access
      setAccess(data.access);

      // сохраняем пользователя
      localStorage.setItem("user", JSON.stringify(data.user));

      // редирект
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="wrapper">
      <form className="form" onSubmit={handleSubmit}>
        <div className="input-group">
          <p>Login</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="inputLogin"
            autoComplete="username"
          />
        </div>
        <div className="input-group">
          <p>Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="inputLogin"
            autoComplete="current-password"
          />
          {error && <p className="errorText">{error}</p>}
        </div>
        <button className="buttonLogin" type="submit">Увійти</button>
      </form>
    </div>
  );
}

export default Login;
