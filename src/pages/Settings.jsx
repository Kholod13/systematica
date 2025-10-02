import React, { useEffect, useState } from "react";
import cancelIcon from "../assets/cancel-white.png";
import { fetchWithAuth } from "../services/auth";
import { ENDPOINTS } from "../services/endpoints";

function Settings({ agentId, onBack }) {
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAgent() {
    try {
        const resp = await fetchWithAuth(`${ENDPOINTS.AGENTS}${agentId}/`);
        if (!resp.ok) {
            setError(`Ошибка загрузки агента: ${resp.status}`);
            setLoading(false);
            return;
        }
        const data = await resp.json();
        setAgentData(data);
        } catch (err) {
            console.error("Ошибка при запросе агента:", err);
            setError("Ошибка при запросе агента");
        }
        finally {
            setLoading(false);
        }
    }

    loadAgent();
  }, [agentId]);

  if (loading) return <p style={{ padding: "20px" }}>Загрузка агента...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  return (
    <div className="chatContent" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <p style={{ fontWeight: 500, color: "gray", fontSize: "20px" }}>
          Інструкція:
        </p>
        <button onClick={onBack} className="inputButton">
          <img className="iconButton" src={cancelIcon} alt="Cancel" />
        </button>
      </div>

      <div className="settingsItem">
        <p><strong>Имя агента:</strong> {agentData.agent_name}</p>
        <p><strong>Codename:</strong> {agentData.agent_codename}</p>
        <p><strong>Модель:</strong> {agentData.model}</p>
        <p><strong>Prompt:</strong> {agentData.prompt}</p>
        <p><strong>Instruction:</strong> {agentData.instruction}</p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <p style={{ fontWeight: 500, color: "gray", fontSize: "20px" }}>
          Примеры использования:
        </p>
      </div>

      <div className="settingsItem">
        <p>{agentData.examples}</p>
      </div>
    </div>
  );
}

export default Settings;
