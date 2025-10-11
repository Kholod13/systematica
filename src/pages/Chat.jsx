import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [fileKey, setFileKey] = useState(0);
  const [type, setType] = useState("Text");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const chatContentRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${ENDPOINTS.MESSAGES}?chat=${chatId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);

      // 🔹 автоскролл после получения сообщений
      setTimeout(() => {
        const chatDiv = chatContentRef.current;
        if (!chatDiv) return;

        const savedScroll = sessionStorage.getItem(`chatScroll-${chatId}`);
        if (savedScroll) {
          chatDiv.scrollTop = parseInt(savedScroll, 10);
        } else {
          chatDiv.scrollTo({ top: chatDiv.scrollHeight, behavior: "smooth" });
        }
      }, 50);
    } catch (err) {
      console.error(err);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleScroll = () => {
    if (!chatContentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isAtBottom);

    // 🔹 сохраняем позицию чата
    sessionStorage.setItem(`chatScroll-${chatId}`, scrollTop);
  };

  useEffect(() => {
    const chatDiv = chatContentRef.current;
    if (!chatDiv) return;
    chatDiv.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => chatDiv.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔹 Автоскролл при 3 секундах бездействия
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedExtensions = [".doc", ".docx"];
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError("⚠️ Дозволено тільки файли формату .doc або .docx");
      setFile(null);
      e.target.value = "";
    } else {
      setError("");
      setFile(selectedFile);
    }
  };

  const copyTable = (table) => {
    const header = Object.keys(table[0]).join("\t");
    const rows = table.map((row) => Object.values(row).join("\t"));
    const tableText = [header, ...rows].join("\n");
    navigator.clipboard.writeText(tableText);
  };

  const handleSend = async () => {
    if (isSending) return;
    if (!text && !file) {
      setError("⚠️ Поле повідомлення порожнє");
      return;
    }

    setError("");
    setIsSending(true);

    const formData = new FormData();
    formData.append("chat", chatId);
    formData.append("type", type);
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
        setFileKey((k) => k + 1);

        await fetchMessages();

        // 🔹 автоскролл вниз после отправки
        setTimeout(() => {
          const chatDiv = chatContentRef.current;
          chatDiv?.scrollTo({ top: chatDiv.scrollHeight, behavior: "smooth" });
        }, 50);
      } else {
        setError("⚠️ Помилка при відправці повідомлення");
      }
    } catch (error) {
      console.error("Помилка при відправці повідомлення:", error);
      setError("⚠️ Помилка мережі або сервера");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chatContainer">
      <div className="chatContent" ref={chatContentRef}>
        {messages.length === 0 && <div className="emptyChat">Повідомлень немає</div>}

        {messages.map((msg) => {
          let parsedTable = msg.table;
          if (typeof parsedTable === "string") {
            try {
              parsedTable = JSON.parse(parsedTable);
            } catch {
              parsedTable = [];
            }
          }

          return (
            <div
              key={msg.message_id}
              className={`chatMessage ${msg.is_user ? "userMessage" : "systemMessage"}`}
            >
              {msg.text && <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>}
              {msg.file && (
                <div>
                  <p>📄 {msg.filename}</p>
                  <a href={msg.file} download={msg.filename} target="_blank" rel="noopener noreferrer">
                    Завантажити документ
                  </a>
                </div>
              )}

              {parsedTable && parsedTable.length > 0 && (
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
                    onClick={() => copyTable(parsedTable)}
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
                          {Object.keys(parsedTable[0]).map((key) => (
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
                        {parsedTable.map((row, i) => (
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
          );
        })}
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

      <div className="chatInput" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <input
            key={fileKey}
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            className="inputButton"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            style={{ opacity: isSending ? 0.5 : 1 }}
          >
            <img className="iconButton" src={plusIcon} alt="Attach" />
          </button>

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

          {file && <span style={{ color: "#00bfff", fontSize: "0.8em" }}>{file.name}</span>}

          {error && (
            <div style={{ color: "#ff4444", fontSize: "0.8em", textAlign: "center" }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
