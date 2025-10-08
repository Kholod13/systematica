import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../services/auth";
import { createChat as createChatAPI } from "../services/chats";
import { Link, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import plusIconBlack from "../assets/plus.png";
import { ENDPOINTS } from "../services/endpoints";
import { NavLink } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [agentChats, setAgentChats] = useState([]);
  const [models, setModels] = useState([]);
  const [chatName, setChatName] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [hasRedirected, setHasRedirected] = useState(false);

  // Logout
  async function handleLogout() {
    try {
      const resp = await fetchWithAuth(ENDPOINTS.LOGOUT, { method: "POST" });
      if (resp.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
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

  // Load chats and redirect to first agent/chat

  useEffect(() => {
    async function loadChats() {
      try {
        const resp = await fetchWithAuth(ENDPOINTS.CHATS);
        if (resp.ok) {
          const data = await resp.json();
          const onlyChats = data.filter((c) => !c.agent || c.agent === 0);
          const onlyAgentChats = data.filter((c) => c.agent && c.agent !== 0);
          setChats(onlyChats);
          setAgentChats(onlyAgentChats);

          // редирект только один раз
          if (!hasRedirected) {
            if (onlyAgentChats.length > 0) {
              navigate(`agent/${onlyAgentChats[0].chat_id}/${onlyAgentChats[0].agent}`, { replace: true });
            } else if (onlyChats.length > 0) {
              navigate(`chat/${onlyChats[0].chat_id}`, { replace: true });
            }
            setHasRedirected(true);
          }
        }
      } catch (err) {
        console.error("Ошибка при запросе чатов:", err);
      }
    }
    loadChats();
  }, [navigate, hasRedirected]);

  // Load models
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

  // Create chat
  async function handleCreateChat() {
    try {
      const modelId = models.find((m) => m.model_codename === selectedModel)?.model_id;
      if (!modelId) throw new Error("Оберіть модель");

      const newChat = await createChatAPI({
        chat_name: chatName,
        agent: null,
        model: modelId,
      });

      if (!newChat.agent || newChat.agent === 0) {
        setChats((prev) => [...prev, newChat]);
        // 🔹 редиректим сразу на созданный обычный чат
        navigate(`chat/${newChat.chat_id}`, { replace: true });
      } else {
        setAgentChats((prev) => [...prev, newChat]);
        // 🔹 редиректим на агентский чат
        navigate(`agent/${newChat.chat_id}/${newChat.agent}`, { replace: true });
      }

      setIsModalOpen(false);
      setChatName("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

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
                <NavLink
                  to={`agent/${chat.chat_id}/${chat.agent}`}
                  className={({ isActive }) => isActive ? "sidebarItemActive" : ""}
                >
                  <p>{chat.chat_name}</p>
                </NavLink>
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
                <NavLink
                  to={`chat/${chat.chat_id}`}
                  className={({ isActive }) => isActive ? "sidebarItemActive" : ""}
                >
                  <p>{chat.chat_name}</p>
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <section className="chat"><Outlet /></section>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Створити новий чат</h3>
            <p>Назва чату:</p>
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
