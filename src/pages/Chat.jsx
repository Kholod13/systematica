import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import sendIcon from "../assets/send-white.png";
import plusIcon from "../assets/plus-white.png";
import arrowIcon from "../assets/arrow.png";
import { fetchWithAuth } from "../services/auth";
import { ENDPOINTS } from "../services/endpoints";

function Chat({ id }) {
  const params = useParams();
  const chatId = params.id ?? id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Text"); // Text, File, Table
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSending, setIsSending] = useState(false); // 🔹 Флаг отправки

  const chatContentRef = useRef(null);
  const fileInputRef = useRef(null);

  // ===============================
  // Подтягивание сообщений
  // ===============================
  const fetchMessages = async () => {
    try {
      const res = await fetchWithAuth(`${ENDPOINTS.MESSAGES}?chat=${chatId}`);
      const data = await res.json();
      setMessages(data);

      setTimeout(() => {
        chatContentRef.current?.scrollTo({
          top: chatContentRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    } catch (error) {
      console.error("Ошибка при загрузке сообщений:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatId]);

  // ===============================
  // Отслеживание скролла
  // ===============================
  const handleScroll = () => {
    if (!chatContentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isAtBottom);
  };

  useEffect(() => {
    const chatDiv = chatContentRef.current;
    if (!chatDiv) return;
    chatDiv.addEventListener("scroll", handleScroll);
    return () => chatDiv.removeEventListener("scroll", handleScroll);
  }, []);

  // ===============================
  // Копирование таблицы
  // ===============================
  const copyTable = (table) => {
    const header = Object.keys(table[0]).join("\t");
    const rows = table.map((row) => Object.values(row).join("\t"));
    const tableText = [header, ...rows].join("\n");
    navigator.clipboard.writeText(tableText);
  };

  // ===============================
  // Отправка сообщения
  // ===============================
  const handleSend = async () => {
    if (isSending || (!text && !file)) return;

    setIsSending(true);

    const formData = new FormData();
    formData.append("chat", chatId);
    formData.append("type", type);
    formData.append("text", text || "");
    formData.append("table", "null");
    if (file) formData.append("file", file);

    const debugData = {};
    formData.forEach((value, key) => {
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
        await fetchMessages();
      } else {
        console.error("Ошибка при отправке сообщения");
      }
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    } finally {
      setIsSending(false);
    }
  };

  // ===============================
  // Рендер
  // ===============================
  return (
    <div className="chatContainer">
      {/* Содержимое чата */}
      <div className="chatContent" ref={chatContentRef}>
        {messages.length === 0 && <div className="emptyChat">Повідомлень немає</div>}

        {messages.map((msg) => (
          <div
            key={msg.message_id}
            className={`chatMessage ${msg.is_user ? "userMessage" : "systemMessage"}`}
          >
            {msg.text && (
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}
              >
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
                  style={{
                    color: "#00bfff",
                    textDecoration: "underline",
                    fontWeight: 500,
                  }}
                >
                  Завантажити документ
                </a>
              </div>
            )}
            {msg.table && msg.table.length > 0 && (
              <div style={{ marginTop: "5px" }}>
                <button
                  style={{
                    backgroundColor: "#5C1014",
                    color: "#fff",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "5px",
                  }}
                  onClick={() => copyTable(msg.table)}
                >
                  Копіювати таблицю
                </button>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      borderCollapse: "collapse",
                      width: "100%",
                      minWidth: "400px",
                      border: "1px solid #555",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <thead style={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
                      <tr>
                        {Object.keys(msg.table[0]).map((key) => (
                          <th
                            key={key}
                            style={{
                              border: "1px solid #555",
                              padding: "8px 12px",
                              textAlign: "left",
                            }}
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.table.map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i % 2 === 0 ? "#2a2a2a" : "#1e1e1e",
                          }}
                        >
                          {Object.values(row).map((val, j) => (
                            <td
                              key={j}
                              style={{
                                border: "1px solid #555",
                                padding: "6px 10px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                color: "#fff",
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

      {/* Кнопка скролла вниз */}
      {showScrollButton && (
        <button
          className="scrollButton"
          onClick={() =>
            chatContentRef.current?.scrollTo({
              top: chatContentRef.current.scrollHeight,
              behavior: "smooth",
            })
          }
        >
          <img src={arrowIcon} alt="Вниз" className="scrollIcon" />
        </button>
      )}

      {/* Поле ввода */}
      <div className="chatInput" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {/* Скрытый input для файла */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: "none" }}
          />

          {/* Кнопка для выбора файла */}
          <button
            className="inputButton"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            style={{ opacity: isSending ? 0.5 : 1 }}
          >
            <img className="iconButton" src={plusIcon} alt="Attach" />
          </button>

          {/* Поле ввода текста */}
          <input
            className="inputField"
            type="text"
            placeholder={isSending ? "Зачекайте..." : "Напишіть свій запит..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (!isSending && e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
            style={{ flex: 1, opacity: isSending ? 0.6 : 1 }}
          />

          {/* Кнопка отправки */}
          <button
            className="inputButton"
            onClick={handleSend}
            disabled={isSending}
            style={{
              opacity: isSending ? 0.5 : 1,
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            <img className="iconButton" src={sendIcon} alt="Send" />
          </button>
        </div>

        {/* Выбор типа сообщения */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {["Text", "File", "Table"].map((option) => (
            <button
              key={option}
              onClick={() => !isSending && setType(option)}
              style={{
                color: type === option ? "#A71A22" : "#ccc",
                border: 0,
                background: "transparent",
                cursor: isSending ? "not-allowed" : "pointer",
                fontWeight: type === option ? "600" : "400",
                transition: "color 0.2s ease",
                opacity: isSending ? 0.5 : 1,
              }}
              disabled={isSending}
            >
              {option}
            </button>
          ))}

          {/* Имя выбранного файла */}
          {file && (
            <span style={{ color: "#00bfff", fontSize: "0.8em" }}>{file.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
