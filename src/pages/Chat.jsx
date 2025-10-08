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
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [expectedAnswer, setExpectedAnswer] = useState("Text"); // 👈 выбор формата ответа

  const fileInputRef = useRef(null);
  const chatContentRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 🔹 Загрузка сообщений
  useEffect(() => {
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
          filename: m.filename,
          messaged_at: m.messaged_at,
        }));
        setMessages(formatted);
      } catch (err) {
        console.error("Ошибка при запросе сообщений:", err);
      }
    }
    loadMessages();
  }, [chatId]);

  // 🔹 Автопрокрутка вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Следим за скроллом
  useEffect(() => {
    const chatEl = chatContentRef.current;
    if (!chatEl) return;
    const handleScroll = () => {
      const isAtBottom =
        chatEl.scrollHeight - chatEl.scrollTop <= chatEl.clientHeight + 5;
      setShowScrollButton(!isAtBottom);
    };
    chatEl.addEventListener("scroll", handleScroll);
    return () => chatEl.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔹 Форматирование текста
  function formatMessageText(text) {
    if (!text) return "";
    const safeText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return safeText
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  // 🔹 Отправка сообщения
  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);

    const userText = inputValue;
    setInputValue("");

    const userMsg = {
      message_id: Date.now(),
      sender: "user",
      text: userText,
      messaged_at: new Date().toISOString(),
    };

    const loadingMsg = {
      message_id: "loading-" + Date.now(),
      sender: "system",
      text: "Systemtica AI формує відповідь...",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const resp = await fetchWithAuth(`${ENDPOINTS.MESSAGES}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat: chatId,
          text: userText,
          expected_answer: expectedAnswer, // 👈 добавляем выбор формата
          file: null,
        }),
      });

      if (!resp.ok) {
        console.error("Ошибка при отправке:", resp.status);
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading ? { ...m, text: "❌ Помилка при генерації" } : m
          )
        );
        return;
      }

      const data = await resp.json();
      console.log("📩 Ответ от сервера:", data);

      if (data.ai_message) {
        const fileUrl = data.ai_message.file
          ? `${import.meta.env.VITE_API_BASE_URL || ""}${data.ai_message.file}`
          : null;

        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading
              ? {
                  message_id: data.ai_message.message_id,
                  sender: "system",
                  text:
                    data.ai_message.text ||
                    (fileUrl ? "AI створив файл 📄" : ""),
                  file: fileUrl,
                  filename: data.ai_message.filename,
                  messaged_at: data.ai_message.messaged_at,
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading ? { ...m, text: "⚠️ Відповідь не отримана" } : m
          )
        );
      }
    } catch (err) {
      console.error("Ошибка при запросе:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading ? { ...m, text: "❌ Помилка сервера" } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // 🔹 Работа с файлами
  const handleAttachClick = () => fileInputRef.current.click();
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
      <div className="chatContent" ref={chatContentRef}>
        {messages.length === 0 ? (
          <div className="emptyChat">Повідомлень немає</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`chatMessage ${
                msg.sender === "user" ? "userMessage" : "systemMessage"
              }`}
            >
              {msg.type === "image" ? (
                <div>
                  <p>📷 {msg.name}</p>
                  <img
                    src={msg.src}
                    alt={msg.name}
                    style={{
                      maxWidth: "250px",
                      borderRadius: "8px",
                      marginTop: "5px",
                    }}
                  />
                </div>
              ) : msg.file ? (
                msg.file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={msg.file}
                    alt={msg.filename || "AI-відповідь"}
                    style={{
                      maxWidth: "250px",
                      borderRadius: "8px",
                      marginTop: "5px",
                    }}
                  />
                ) : (
                  <div>
                    <p>📎 {msg.filename || "Файл від AI"}</p>
                    <a
                      href={msg.file}
                      download={msg.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#00bfff",
                        textDecoration: "underline",
                        fontWeight: "500",
                      }}
                    >
                      Завантажити файл
                    </a>
                  </div>
                )
              ) : (
                <p
                  className={msg.isLoading ? "loading" : ""}
                  dangerouslySetInnerHTML={{
                    __html: formatMessageText(msg.text),
                  }}
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5",
                    wordBreak: "break-word",
                  }}
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button className="scrollButton" onClick={scrollToBottom}>
          <img src={arrowIcon} alt="Вниз" className="scrollIcon" />
        </button>
      )}

      {/* 🔹 Радио-кнопки выбора формата */}
      <div className="formatSelector">
        <label>
          <input
            type="radio"
            value="Text"
            checked={expectedAnswer === "Text"}
            onChange={(e) => setExpectedAnswer(e.target.value)}
          />
          Текст
        </label>
        <label>
          <input
            type="radio"
            value="Table"
            checked={expectedAnswer === "Table"}
            onChange={(e) => setExpectedAnswer(e.target.value)}
          />
          Таблиця
        </label>
        <label>
          <input
            type="radio"
            value="Doc"
            checked={expectedAnswer === "Doc"}
            onChange={(e) => setExpectedAnswer(e.target.value)}
          />
          Документ
        </label>
      </div>

      {/* 🔹 Ввод и кнопки */}
      <div className="chatInput">
        <button className="inputButton" onClick={handleAttachClick}>
          <img className="iconButton" src={plusIcon} alt="Attach" />
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
          onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
          disabled={isSending}
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
    </div>
  );
}

export default Chat;
