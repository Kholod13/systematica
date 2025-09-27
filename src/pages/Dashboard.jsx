import React, { useState } from 'react';
import logo from '../assets/logo.svg';
import { Routes, Route, Link, Outlet } from 'react-router-dom';

function Dashboard() {
  const chats = [0, 1, 2, 3, 4]; // Пример списка чатов
  const agents = [1, 2]; // Пример списка агентов

  // 🔹 Стейты для модалки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");

  // 🔹 Сохранение и закрытие модалки
  const handleCreate = () => {
    console.log("Создан чат:", { input1, input2 });
    setIsModalOpen(false); // закрыть окно
    setInput1("");
    setInput2("");
  };

  return (
    <div className="wrapper">
      <header>
        <div className="logoBlock">
          <img src={logo} alt="Vite logo" height={40} />
        </div>
        <div className="navBlock">
          <p style={{marginLeft: "40px", fontWeight: 600, fontSize: "18px"}}>GPT</p>
        </div>
      </header>

      <main className="content">
        {/* Sidebar */}
        <aside className="sidebar">
          <p>Агенти</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {agents.map((id) => (
              <li key={id}>
                <Link to={`agent/${id}`}>Агент {id}</Link>
              </li>
            ))}
          </ul>

          <div>
            <p>Чати</p>
            <button onClick={() => setIsModalOpen(true)}>+ Создать чат</button>
          </div>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {chats.map((id) => (
              <li key={id}>
                <Link to={`chat/${id}`}>Чат {id}</Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Контент */}
        <section className="chat">
          <Outlet /> {/* сюда рендерится Chat */}
        </section>
      </main>

      {/* 🔹 Модальное окно */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Создать новый чат</h3>
            <input
              type="text"
              placeholder="Введите название"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
            />
            <input
              type="text"
              placeholder="Введите описание"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
            />
            <div style={{ marginTop: "1rem" }}>
              <button onClick={handleCreate}>Create</button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
