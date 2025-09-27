import React, { useState } from "react";
import { ENDPOINTS } from "../services/endpoints";
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // 🔹 эта функция будет вызываться при клике на кнопку
  const handleSubmit = async (e) => {
    e.preventDefault(); // чтобы не перезагружалась страница
    setError(null);

    try {
      const response = await fetch(ENDPOINTS.LOGIN, { // <-- твой endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "koliakova",
          password: "Test12345!",
        }),
      });

      if (!response.ok) {
        console.log("link server:", ENDPOINTS.LOGIN);
        console.log("Статус ответа:", response.status);
        const text = await response.text();
        console.log("Ответ сервера:", text);
        throw new Error("Неверный логин или пароль");
      }

      const data = await response.json();
      console.log("✅ Ответ от API:", data);

      // 🔹 Сохраняем access токен
      localStorage.setItem("access", data.access);

      // 🔹 Можно сохранить и данные пользователя
      localStorage.setItem("user", JSON.stringify(data.user));

      // 🔹 Перенаправление после входа
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
          />
          {error && <p className="errorText">{error}</p>}
        </div>
        <button className="buttonLogin" type="submit">Увійти</button>
      </form>
    </div>
  );
}

export default Login;
