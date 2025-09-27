import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import sendIcon from "../assets/send-white.png";
import plusIcon from "../assets/plus-white.png";
import questionIcon from "../assets/question-white.png";
import Settings from "./Settings"; // 🔹 импортируем новый компонент

function Agent({ id }) {
  const params = useParams();
  const agentId = params.id ?? id;

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [showSettings, setShowSettings] = useState(false); // 🔹 переключатель

  const fileInputRef = useRef(null);

  useEffect(() => {
    setMessages([{ sender: "system", text: `Это агент #${agentId}` }]);
    setShowSettings(false); // 🔹 при смене агента возвращаем чат
  }, [agentId]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMessage = { sender: "user", text: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
  };

  const handleAttachClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newMessage = {
          sender: "user",
          type: "image",
          src: event.target.result,
          name: file.name,
        };
        setMessages((prev) => [...prev, newMessage]);
      };
      reader.readAsDataURL(file);
    } else {
      const newMessage = { sender: "user", type: "file", text: `📎 ${file.name}` };
      setMessages((prev) => [...prev, newMessage]);
    }

    e.target.value = "";
  };

  return (
    <div className="chatContainer">
        {showSettings ? (
        <Settings onBack={() => setShowSettings(false)} /> // 🔹 кнопка вернет чат
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
            </div>

            <div className="chatInput">
            <button className="inputButton" onClick={handleAttachClick}>
                <img className="iconButton" src={plusIcon} alt="Attach" />
            </button>

            <button className="inputButton" onClick={() => setShowSettings(true)}>
                <img className="iconButton" src={questionIcon} alt="Settings" />
            </button>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />

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
