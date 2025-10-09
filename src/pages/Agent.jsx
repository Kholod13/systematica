import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import sendIcon from "../assets/send-white.png";
import plusIcon from "../assets/plus-white.png";
import questionIcon from "../assets/question-white.png";
import arrowIcon from "../assets/arrow.png";
import { fetchWithAuth } from "../services/auth";
import { ENDPOINTS } from "../services/endpoints";
import Settings from "./Settings";
import { useCallback } from "react";


function Agent() {
  const { chatId, agentId } = useParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [type] = useState("Text");
  const chatContentRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSending, setIsSending] = useState(false); // 🔹 флаг отправки

// ===============================
  // Подтягивание сообщений
  // ===============================
const fetchMessages = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${ENDPOINTS.MESSAGES}?chat=${chatId}`);
      if (!res.ok) {
        console.error("Ошибка при fetchMessages:", res.status);
        return;
      }
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  }, [chatId]);

  useEffect(() => {
    // Загрузить историю при монтировании — один вызов
    fetchMessages();
  }, [fetchMessages]);


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
    chatDiv.addEventListener("scroll", handleScroll, { passive: true });
    // начальная проверка
    handleScroll();
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
  
      // debug лог формы
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
          // очистить инпуты
          setText("");
          setFile(null);
  
          // Вариант 4: подтягиваем сообщения **после** отправки
          await fetchMessages();
          // опционально — пролистать вниз
          chatContentRef.current?.scrollTo({ top: chatContentRef.current.scrollHeight, behavior: "smooth" });
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
      {showSettings ? (
        <Settings agentId={agentId} onBack={() => setShowSettings(false)} />
      ) : (
        <>
          {/* Сообщения */}
          <div className="chatContent" ref={chatContentRef}>
            {messages.length === 0 && (
              <div className="emptyChat">Повідомлень немає</div>
            )}

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
                                backgroundColor:
                                  i % 2 === 0 ? "#2a2a2a" : "#1e1e1e",
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

          {/* Кнопка "вниз" */}
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
        </>
      )}

      {/* Ввод сообщения */}
      <div className="chatInput" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {/* Скрытый input для файла */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: "none" }}
          />

          {/* Кнопка с плюсом */}
          <button
            className="inputButton"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            style={{ opacity: isSending ? 0.5 : 1 }}
          >
            <img className="iconButton" src={plusIcon} alt="Attach" />
          </button>

          {/* Кнопка настроек */}
          <button
            className="inputButton"
            onClick={() => setShowSettings(true)}
            disabled={isSending}
            style={{ opacity: isSending ? 0.5 : 1 }}
          >
            <img className="iconButton" src={questionIcon} alt="Settings" />
          </button>

          {/* Поле ввода */}
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

          {/* Отправка */}
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

        {/* Имя файла */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {file && (
            <span style={{ color: "#00bfff", fontSize: "0.9em" }}>{file.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Agent;
