import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../services/auth";
import { createChat as createChatAPI } from "../services/chats";
import { Link, Outlet } from "react-router-dom";
import logo from "../assets/logo.svg";
import plusIconBlack from "../assets/plus.png";
import { ENDPOINTS } from "../services/endpoints";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [agentChats, setAgentChats] = useState([]);
  const [models, setModels] = useState([]);
  const [chatName, setChatName] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

//logout button
async function handleLogout() {
    try {
      const resp = await fetchWithAuth(ENDPOINTS.LOGOUT, {
        method: "POST",
      });

      if (resp.ok) {
        console.log("✅ Logout успешный");
        // Удаляем локальные данные
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        // Перенаправляем на страницу логина
        navigate("/login");
      } else {
        const error = await resp.json();
        console.error("Ошибка logout:", error);
        alert("Не удалось выйти");
      }
    } catch (err) {
      console.error("Ошибка запроса logout:", err);
    }
}

  // Загружаем чаты
  async function loadChats() {
    try {
      const resp = await fetchWithAuth(ENDPOINTS.CHATS);
      if (resp.ok) {
        const data = await resp.json();
        const onlyChats = data.filter((c) => !c.agent || c.agent === 0);
        const onlyAgentChats = data.filter((c) => c.agent && c.agent !== 0);
        setChats(onlyChats);
        setAgentChats(onlyAgentChats);
      }
    } catch (err) {
      console.error("Ошибка при запросе чатов:", err);
    }
  }

  // Загружаем модели
  async function loadModels() {
    try {
      const resp = await fetchWithAuth(ENDPOINTS.MODELS);
      if (resp.ok) {
        const data = await resp.json();
        setModels(data);
        if (data.length > 0) setSelectedModel(data[0].model_codename);
      }
    } catch (err) {
      console.error("Ошибка при загрузке моделей:", err);
    }
  }

  // Создать чат
  async function handleCreateChat() {
    try {
      const modelId = models.find((m) => m.model_codename === selectedModel)?.model_id;
      if (!modelId) throw new Error("Виберіть модель");

      const newChat = await createChatAPI({
        chat_name: chatName,
        agent: null,
        model: modelId,
      });

      console.log("✅ Чат создан:", newChat);

      if (!newChat.agent || newChat.agent === 0) {
        setChats((prev) => [...prev, newChat]);
      } else {
        setAgentChats((prev) => [...prev, newChat]);
      }

      setIsModalOpen(false);
      setChatName("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  return (
    <div className="wrapper">
      <header>
        <div className="logoBlock" onClick={handleLogout} style={{ cursor: "pointer" }}>
          <img src={logo} alt="Vite logo" height={40} />
        </div>
        <div className="navBlock">
          <p style={{ marginLeft: "40px", fontWeight: 600, fontSize: "18px" }}>GPT</p>
        </div>
      </header>

      <main className="content">
        <aside className="sidebar">
          <div className="sidebarTitle"><p>Агенти</p></div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {agentChats.map((chat) => (
              <li className="sidebarItem" key={chat.chat_id}>
                <Link to={`agent/${chat.chat_id}/${chat.agent}`}><p>{chat.chat_name}</p></Link>
              </li>
            ))}
          </ul>

          <div className="sidebarTitle">
            <p>Чати</p>
            <button
              className="addChatButton"
              onClick={() => {
                setIsModalOpen(true);
                loadModels();
              }}
            >
              <img style={{ width: "15px" }} src={plusIconBlack} alt="Add" />
            </button>
          </div>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {chats.map((chat) => (
              <li className="sidebarItem" key={chat.chat_id}>
                <Link to={`chat/${chat.chat_id}`}><p>{chat.chat_name}</p></Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className="chat"><Outlet /></section>
      </main>

      {/* Модалка */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Створити новий чат</h3>

            <p>Назва чата:</p>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="inputLogin"
              placeholder="Введіть назву"
            />

            <p style={{ marginTop: "10px" }}>Модель:</p>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="inputLogin"
            >
              {models.map((m) => (
                <option key={m.model_id} value={m.model_codename}>{m.model_name}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="buttonLogin" onClick={handleCreateChat}>Створити</button>
              <button className="buttonLogin" onClick={() => setIsModalOpen(false)}>Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
