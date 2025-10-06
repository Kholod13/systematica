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
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContentRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // 🔹 Загрузка сообщений
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

  // 🔹 Автоскролл вниз при добавлении сообщений
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

  // 🔹 Форматирование текста (аналогично Chat.jsx)
  function formatMessageText(text) {
    if (!text) return "";

    const safeText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return safeText
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>") // *жирный*
      .replace(/_([^_]+)_/g, "<em>$1</em>")           // _курсив_
      .replace(/`([^`]+)`/g, "<code>$1</code>")       // `код`
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
          file: null,
        }),
      });

      if (!resp.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading ? { ...m, text: "❌ Помилка при генерації" } : m
          )
        );
        return;
      }

      const data = await resp.json();

      if (data.ai_message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading
              ? {
                  message_id: data.ai_message.message_id,
                  sender: "system",
                  text: data.ai_message.text,
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

  if (!chatId || !agentId) {
    return <p style={{ padding: "20px", color: "red" }}>❌ Помилка: chatId або agentId не вказано</p>;
  }

  return (
    <div className="chatContainer">
      {showSettings ? (
        <Settings agentId={agentId} onBack={() => setShowSettings(false)} />
      ) : (
        <>
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
                          maxWidth: "200px",
                          borderRadius: "8px",
                          marginTop: "5px",
                        }}
                      />
                    </div>
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

            <button className="inputButton" onClick={() => setShowSettings(true)}>
              <img className="iconButton" src={questionIcon} alt="Settings" />
            </button>

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
        </>
      )}
    </div>
  );
}

export default Agent;
