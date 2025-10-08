import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import sendIcon from "../assets/send-white.png";
import plusIcon from "../assets/plus-white.png";
import questionIcon from "../assets/question-white.png";
import arrowIcon from "../assets/arrow.png";
import { fetchWithAuth } from "../services/auth";
import { ENDPOINTS } from "../services/endpoints";
import Settings from "./Settings";

function Agent() {
  const { chatId, agentId } = useParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Text"); // Text, File, Table
  const chatContentRef = useRef(null);

  // Подтягивание сообщений
  const fetchMessages = async () => {
    try {
      const res = await fetchWithAuth(`${ENDPOINTS.MESSAGES}?chat=${chatId}`);
      const data = await res.json();
      setMessages(data);

      setTimeout(() => {
        chatContentRef.current?.scrollTo({ top: chatContentRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (error) {
      console.error("Ошибка при загрузке сообщений:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // автообновление каждые 5 секунд
    return () => clearInterval(interval);
  }, [chatId]);

  // Копирование таблицы
  const copyTable = (table) => {
    const header = Object.keys(table[0]).join("\t");
    const rows = table.map((row) => Object.values(row).join("\t"));
    const tableText = [header, ...rows].join("\n");
    navigator.clipboard.writeText(tableText);
  };

  // Отправка сообщения
  const handleSend = async () => {
  if (!text && !file) return;

  const formData = new FormData();
  formData.append("chat", chatId);
  formData.append("type", type);
  formData.append("text", text || "");
  formData.append("table", null);
  if (file) formData.append("file", file);

  // Для отладки: выводим данные в консоль
  const debugData = {};
  formData.forEach((value, key) => {
    // Если value это файл, выводим только имя
    debugData[key] = value instanceof File ? value.name : value;
  });
  console.log("Отправляем на сервер:", debugData);

  try {
    const res = await fetchWithAuth(ENDPOINTS.MESSAGES, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setText("");
      setFile(null);
      fetchMessages(); // подтягиваем новые сообщения
    } else {
      console.error("Ошибка при отправке сообщения");
    }
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
  }
};


  return (
    <div className="chatContainer">
      {/* Сообщения */}
      <div className="chatContent" ref={chatContentRef}>
        {messages.length === 0 && <div className="emptyChat">Повідомлень немає</div>}

        {messages.map((msg) => (
          <div
            key={msg.message_id}
            className={`chatMessage ${msg.is_user ? "userMessage" : "systemMessage"}`}
          >
            {msg.text && (
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, wordBreak: "break-word" }}>
                {msg.text}
              </p>
            )}
            {msg.file && (
              <div>
                <p>📄 {msg.filename}</p>
                <a
                  href={msg.file}
                  download={msg.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#00bfff", textDecoration: "underline", fontWeight: 500 }}
                >
                  Завантажити документ
                </a>
              </div>
            )}
            {msg.table && msg.table.length > 0 && (
              <div style={{ marginTop: "5px" }}>
                <button
                  style={{
                    backgroundColor: "#4caf50",
                    color: "#fff",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "5px",
                  }}
                  onClick={() => copyTable(msg.table)}
                >
                  Скопировать
                </button>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      borderCollapse: "collapse",
                      width: "100%",
                      minWidth: "400px",
                      tableLayout: "auto",
                      border: "1px solid #555",
                    }}
                  >
                    <thead style={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
                      <tr>
                        {Object.keys(msg.table[0]).map((key) => (
                          <th
                            key={key}
                            style={{ border: "1px solid #555", padding: "8px 12px", textAlign: "left" }}
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.table.map((row, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#2a2a2a" : "#1e1e1e" }}>
                          {Object.values(row).map((val, j) => (
                            <td
                              key={j}
                              style={{
                                border: "1px solid #555",
                                padding: "6px 10px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                color: "#fff",
                                userSelect: "text",
                              }}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Скролл-кнопка */}
      <button
        className="scrollButton"
        onClick={() =>
          chatContentRef.current?.scrollTo({ top: chatContentRef.current.scrollHeight, behavior: "smooth" })
        }
      >
        <img src={arrowIcon} alt="Вниз" className="scrollIcon" />
      </button>

      {/* Ввод сообщения */}
      <div className="chatInput" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <button className="inputButton">
            <img className="iconButton" src={plusIcon} alt="Attach" />
          </button>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: "none" }}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={{ cursor: "pointer", color: "#00bfff" }}>
            {file ? file.name : "Прикрепить файл"}
          </label>
          <input
            className="inputField"
            type="text"
            placeholder="Напишіть свій запит..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="inputButton" onClick={handleSend}>
            <img className="iconButton" src={sendIcon} alt="Send" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Agent;
