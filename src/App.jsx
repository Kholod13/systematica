import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Agent from "./pages/Agent";
import ProtectedRoute from "./components/ProtectedRoute";

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
          {/* Если чат не выбран, редирект на chat_0 */}
          <Route index element={<Chat id="0" />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="agent/:id" element={<Agent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
