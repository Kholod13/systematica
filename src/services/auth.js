import api from "./api";

export const login = (data) => api.post("/auth/login", data);
export const getUser = () => api.get("/user/me");
