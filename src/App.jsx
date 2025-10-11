import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Agent from "./pages/Agent";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичная страница */}
        <Route path="/login" element={<Login />} />

        {/* Закрытые маршруты */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Chat id="0" />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="agent/:chatId/:agentId" element={<Agent />} />
          <Route path="settings/:agentId" element={<Settings />} />  {/* ← вот это добавь */}
        </Route>

        {/* Если корень — редиректим на /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 — если путь не найден */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
