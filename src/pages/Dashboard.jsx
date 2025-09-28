import React, { useState } from 'react';
import logo from '../assets/logo.svg';
import { Routes, Route, Link, Outlet } from 'react-router-dom';
import plusIconBlack from "../assets/plus.png";

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
          <div className='sidebarTitle'>
            <p>Агенти</p>
          </div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {agents.map((id) => (
              <li className='sidebarItem' key={id}>
                <Link to={`agent/${id}`}><p>Агент {id}</p></Link>
              </li>
            ))}
          </ul>

          <div className='sidebarTitle'>
            <p>Чати</p>
            <button className='addChatButton' onClick={() => setIsModalOpen(true)}>
              <img style={{width: '15px'}} src={plusIconBlack} alt='Add'></img>
            </button>
          </div>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {chats.map((id) => (
              <li className='sidebarItem' key={id}>
                <Link to={`chat/${id}`}><p>Чат {id}</p></Link>
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
            <p>Назва чату</p>
            <input
              type="text"
              placeholder="Введіть назву"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              className='inputLogin'
              style={{ outline: 'none', boxShadow: '0 0 5px #9C9C9C'}}
            />
            <p>Модель чату</p>
            <input
              type="text"
              placeholder="Введіть модель"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              className='inputLogin'
              style={{ outline: 'none', boxShadow: '0 0 5px #9C9C9C'}}
            />
            <div style={{ display: 'flex', gap: '30px', padding: '10px' }}>
              <button className='buttonLogin' onClick={handleCreate}>Create</button>
              <button className='buttonLogin' onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
