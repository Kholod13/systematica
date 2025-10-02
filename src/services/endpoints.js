const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/ai_chat/auth/login/`,
    CHATS: `${API_BASE_URL}/ai_chat/chats/`,
    REFRESH: `${API_BASE_URL}/ai_chat/auth/refresh/`,
    MODELS: `${API_BASE_URL}/ai_chat/models/`,
    MESSAGES: `${API_BASE_URL}/ai_chat/messages/`,
    AGENTS: `${API_BASE_URL}/ai_chat/agents/`,
    LOGOUT: `${API_BASE_URL}/ai_chat/auth/logout/`,
};