import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const chatContentRef = useRef(null);
  const fileInputRef = useRef(null);

  // ===============================
  // Получение сообщений
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

      // 🔹 автоскролл вниз после получения сообщений
      setTimeout(() => {
        chatContentRef.current?.scrollTo({
          top: chatContentRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);

    } catch (err) {
      console.error(err);
    }
  }, [chatId]);

  useEffect(() => {
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

    sessionStorage.setItem(`agentChatScroll-${chatId}`, scrollTop);
  };

  useEffect(() => {
    const chatDiv = chatContentRef.current;
    if (!chatDiv) return;
    chatDiv.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => chatDiv.removeEventListener("scroll", handleScroll);
  }, []);

  // ===============================
  // Таймер бездействия 3 секунды
  // ===============================
  useEffect(() => {
    const chatDiv = chatContentRef.current;
    if (!chatDiv) return;

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = chatDiv;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        if (!isAtBottom) {
          chatDiv.scrollTo({ top: scrollHeight, behavior: "smooth" });
        }
      }, 3000); // 3 секунды бездействия
    };

    chatDiv.addEventListener("mousemove", resetTimer);
    chatDiv.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      chatDiv.removeEventListener("mousemove", resetTimer);
      chatDiv.removeEventListener("keydown", resetTimer);
    };
  }, [messages]);

  // ===============================
  // Копирование таблицы
  // ===============================
  const copyTable = (table) => {
    const header = Object.keys(table[0]).join("\t");
    const rows = table.map((row) => Object.values(row).join("\t"));
    navigator.clipboard.writeText([header, ...rows].join("\n"));
  };

  // ===============================
  // Отправка сообщения с автоскроллом
  // ===============================
  const handleSend = async () => {
    if (isSending || (!text && !file)) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append("chat", chatId);
    formData.append("type", "Text");
    formData.append("text", text || "");
    formData.append("table", "null");
    if (file) formData.append("file", file);

    try {
      const res = await fetchWithAuth(ENDPOINTS.MESSAGES, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setText("");
        setFile(null);
        await fetchMessages();

        // 🔹 автоскролл вниз после отправки сообщения
        setTimeout(() => {
          chatContentRef.current?.scrollTo({
            top: chatContentRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 50);
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
          <div className="chatContent" ref={chatContentRef}>
            {messages.length === 0 && (
              <div className="emptyChat">Повідомлень немає</div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`chatMessage ${
                  msg.is_user ? "userMessage" : "systemMessage"
                }`}
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
                        <thead
                          style={{ backgroundColor: "#1e1e1e", color: "#fff" }}
                        >
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

          <div
            className="chatInput"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              marginTop: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />

              <button
                className="inputButton"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <img className="iconButton" src={plusIcon} alt="Attach" />
              </button>

              <button
                className="inputButton"
                onClick={() => setShowSettings(true)}
                disabled={isSending}
              >
                <img className="iconButton" src={questionIcon} alt="Settings" />
              </button>

              <input
                className="inputField"
                type="text"
                placeholder={
                  isSending ? "Зачекайте..." : "Напишіть свій запит..."
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (!isSending && e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isSending}
                style={{ flex: 1 }}
              />

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

            {file && (
              <div style={{ marginLeft: "10px", color: "#00bfff" }}>
                {file.name}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Agent;
