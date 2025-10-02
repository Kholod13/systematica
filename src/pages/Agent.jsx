import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import sendIcon from "../assets/send-white.png";
import plusIcon from "../assets/plus-white.png";
import questionIcon from "../assets/question-white.png";
import { fetchWithAuth } from "../services/auth";
import { ENDPOINTS } from "../services/endpoints";
import Settings from "./Settings";

function Agent() {
  const { chatId, agentId } = useParams(); // получаем параметры из URL

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Загружаем сообщения
  useEffect(() => {
    if (!chatId) return;

    async function loadMessages() {
      try {
        const resp = await fetchWithAuth(`${ENDPOINTS.MESSAGES}?chat=${chatId}`);
        if (!resp.ok) {
          console.error("Ошибка при загрузке сообщений:", resp.status);
          return;
        }

        const data = await resp.json();
        const formatted = data.map((m) => ({
          message_id: m.message_id,
          sender: m.is_user ? "user" : "system",
          text: m.text,
          file: m.file,
          messaged_at: m.messaged_at,
        }));

        setMessages(formatted);
      } catch (err) {
        console.error("Ошибка при запросе сообщений:", err);
      }
    }

    loadMessages();
  }, [chatId]);

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: inputValue }]);
    setInputValue("");
    // TODO: добавить POST-запрос для отправки сообщения на сервер
  };

  const handleAttachClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMessages((prev) => [
          ...prev,
          { sender: "user", type: "image", src: event.target.result, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    } else {
      setMessages((prev) => [...prev, { sender: "user", type: "file", text: `📎 ${file.name}` }]);
    }

    e.target.value = "";
  };

  if (!chatId || !agentId) {
    return <p style={{ padding: "20px", color: "red" }}>Ошибка: chatId или agentId не указан</p>;
  }

  return (
    <div className="chatContainer">
      {showSettings ? (
        <Settings agentId={agentId} onBack={() => setShowSettings(false)} />
      ) : (
        <>
          <div className="chatContent">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatMessage ${msg.sender === "user" ? "userMessage" : "systemMessage"}`}
              >
                {msg.type === "image" ? (
                  <div>
                    <p>📷 {msg.name}</p>
                    <img
                      src={msg.src}
                      alt={msg.name}
                      style={{ maxWidth: "200px", borderRadius: "8px", marginTop: "5px" }}
                    />
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatInput">
            <button className="inputButton" onClick={handleAttachClick}>
              <img className="iconButton" src={plusIcon} alt="Attach" />
            </button>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

            <button className="inputButton" onClick={() => setShowSettings(true)}>
              <img className="iconButton" src={questionIcon} alt="Settings" />
            </button>

            <input
              className="inputField"
              type="text"
              placeholder="Напишіть свій запит..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            <button className="inputButton" onClick={handleSend}>
              <img className="iconButton" src={sendIcon} alt="Send" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Agent;
