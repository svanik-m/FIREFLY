import { useEffect, useState } from "react";
import {
  getNetwork,
  getAlerts,
  sendSOS,
  toggleNode as toggleBackendNode,
  resetNetwork as resetBackendNetwork,
} from "./api";

const initialNodes = [
  { id: "ST-01", name: "Student Device", type: "student", online: true },
  { id: "RLY-01", name: "Relay North", type: "relay", online: true },
  { id: "RLY-02", name: "Relay South", type: "relay", online: true },
  { id: "RLY-03", name: "Relay Backup", type: "relay", online: true },
  { id: "GW-01", name: "Command Gateway", type: "gateway", online: true },
];

const incidents = [
  "Medical Emergency",
  "Fire / Smoke",
  "Security Threat",
  "Trapped / Locked In",
  "Other Emergency",
];

const initialAlerts = [
  {
    id: "FF-104281",
    incident: "Medical Emergency",
    block: "Block A",
    floor: "Floor 2",
    time: "12:42:08",
    status: "Delivered",
    route: "ST-01 â†’ RLY-01 â†’ GW-01",
  },
  {
    id: "FF-104276",
    incident: "Security Threat",
    block: "Block C",
    floor: "Floor 1",
    time: "12:38:41",
    status: "Acknowledged",
    route: "ST-01 â†’ RLY-02 â†’ GW-01",
  },
];

const colors = {
  bg: "#080d18",
  panel: "#101827",
  border: "#243247",
  text: "#e8eef8",
  muted: "#8c9bb1",
  cyan: "#56e4f5",
  green: "#51e0a0",
  red: "#ff667d",
  amber: "#ffc46b",
};

const css = `
* { box-sizing: border-box; }
body { margin: 0; background: ${colors.bg}; color: ${colors.text}; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { opacity: .4; cursor: not-allowed; }
.ff { min-height: 100vh; background: radial-gradient(ellipse at 70% 0%, #14263a 0%, #080d18 48%); }
.ff button:focus-visible, .ff input:focus-visible, .ff select:focus-visible { outline: 2px solid ${colors.cyan}; outline-offset: 2px; }
.header { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:20px 5%; border-bottom:1px solid ${colors.border}; background:#0b1220dd; flex-wrap:wrap; }
.brand { display:flex; align-items:center; gap:12px; }
.logo { display:grid; place-items:center; width:43px; height:43px; border:1px solid ${colors.cyan}; color:${colors.cyan}; border-radius:13px; font-size:22px; box-shadow:0 0 25px #56e4f522; }
.brand h1 { margin:0; font-size:23px; letter-spacing:4px; }
.brand p { margin:4px 0 0; font-size:11px; color:${colors.muted}; letter-spacing:1.5px; }
.top-status { display:flex; align-items:center; gap:9px; color:${colors.green}; font-size:12px; border:1px solid #51e0a044; border-radius:30px; padding:9px 13px; }
.dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:${colors.green}; }
.main { max-width:1440px; margin:auto; padding:28px 5% 50px; }
.eyebrow { color:${colors.cyan}; text-transform:uppercase; font-size:11px; letter-spacing:2px; font-weight:700; }
.heading { display:flex; justify-content:space-between; align-items:end; gap:15px; margin-bottom:24px; flex-wrap:wrap; }
.heading h2 { margin:9px 0 6px; font-size:clamp(25px,4vw,36px); letter-spacing:-1px; }
.heading p { margin:0; color:${colors.muted}; font-size:13px; }
.badge { padding:7px 10px; border:1px solid ${colors.border}; border-radius:8px; color:${colors.muted}; font-size:11px; }
.stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:20px; }
.stat { background:${colors.panel}; border:1px solid ${colors.border}; border-radius:14px; padding:18px; }
.stat-label { color:${colors.muted}; font-size:12px; }
.stat-value { font-size:29px; font-weight:750; margin:11px 0 5px; }
.stat-note { color:${colors.muted}; font-size:11px; }
.layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(290px,1fr); gap:20px; align-items:start; }
.panel { background:${colors.panel}; border:1px solid ${colors.border}; border-radius:16px; overflow:hidden; margin-bottom:20px; }
.panel-head { padding:19px 21px; border-bottom:1px solid ${colors.border}; display:flex; justify-content:space-between; align-items:center; gap:10px; }
.panel-head h3 { margin:0; font-size:15px; }
.panel-head p { margin:5px 0 0; color:${colors.muted}; font-size:11px; }
.panel-body { padding:20px; }
.network { min-height:290px; padding:24px 10px; display:flex; flex-direction:column; justify-content:center; gap:25px; background-image:radial-gradient(#243247 1px,transparent 1px); background-size:18px 18px; }
.network-row { display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; }
.node { position:relative; width:116px; min-height:91px; border:1px solid ${colors.border}; background:#0b1422; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; padding:12px 6px; text-align:center; }
.node-icon { font-size:23px; }
.node-name { font-size:11px; font-weight:700; }
.node-id { font-size:10px; color:${colors.muted}; }
.node.online { border-color:#56e4f577; box-shadow:inset 0 0 20px #56e4f509; }
.node.offline { border-color:${colors.red}; background:#301521; opacity:.85; }
.node-student { border-color:${colors.green} !important; }
.node-gateway { border-color:${colors.amber} !important; }
.link { color:${colors.cyan}; font-size:20px; }
.link.down { color:${colors.red}; }
.node-status { font-size:9px; text-transform:uppercase; letter-spacing:1px; }
.online-text { color:${colors.green}; }
.offline-text { color:${colors.red}; }
.network-legend { display:flex; justify-content:center; gap:16px; flex-wrap:wrap; font-size:10px; color:${colors.muted}; }
.legend-item { display:flex; align-items:center; gap:6px; }
.legend-square { width:8px; height:8px; border-radius:2px; }
.hint { color:${colors.muted}; font-size:11px; line-height:1.6; margin:15px 0 0; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.field { display:flex; flex-direction:column; gap:7px; }
.field.full { grid-column:1/-1; }
.field label { color:${colors.muted}; font-size:11px; }
.field input, .field select { width:100%; min-width:0; background:#0a1220; border:1px solid ${colors.border}; border-radius:9px; color:${colors.text}; padding:12px; }
.primary { border:0; border-radius:9px; background:${colors.cyan}; color:#07121e; font-weight:800; padding:13px 15px; }
.secondary { border:1px solid ${colors.border}; border-radius:8px; background:#121e2e; color:${colors.text}; padding:9px 12px; font-size:11px; }
.danger { border:1px solid #ff667d55; border-radius:8px; background:#321622; color:#ff91a1; padding:9px 12px; font-size:11px; }
.notice { margin-top:14px; padding:12px; border-radius:9px; border:1px solid ${colors.cyan}55; background:#142432; color:${colors.cyan}; font-size:12px; line-height:1.5; }
.notice.error { border-color:#ff667d66; background:#301521; color:#ff91a1; }
.alert-list { display:flex; flex-direction:column; }
.alert { padding:16px 20px; border-bottom:1px solid ${colors.border}; }
.alert:last-child { border-bottom:0; }
.alert-top { display:flex; justify-content:space-between; align-items:start; gap:10px; }
.alert h4 { margin:0 0 6px; font-size:12px; }
.alert p { margin:0; color:${colors.muted}; font-size:11px; line-height:1.7; overflow-wrap:anywhere; }
.pill { display:inline-block; padding:5px 8px; border-radius:20px; font-size:9px; white-space:nowrap; }
.pill-delivered { background:#153a32; color:${colors.green}; }
.pill-ack { background:#163342; color:${colors.cyan}; }
.pill-failed { background:#3b2029; color:${colors.red}; }
.alert-actions { margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; }
.node-controls { display:flex; flex-direction:column; }
.node-control { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:13px 20px; border-bottom:1px solid ${colors.border}; }
.node-control:last-child { border-bottom:0; }
.node-control strong { font-size:11px; }
.node-control small { display:block; margin-top:4px; color:${colors.muted}; font-size:10px; }
.toggle { border:1px solid ${colors.border}; border-radius:20px; padding:6px 9px; font-size:10px; }
.toggle.on { color:${colors.green}; background:#153a32; border-color:#51e0a055; }
.toggle.off { color:${colors.red}; background:#3b2029; border-color:#ff667d55; }
.footer { text-align:center; padding:20px; border-top:1px solid ${colors.border}; color:${colors.muted}; font-size:10px; letter-spacing:.6px; }
@media(max-width:850px) { .layout { grid-template-columns:1fr; } .stats { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:520px) { .main { padding:22px 4% 35px; } .header { padding:17px 4%; } .stats { gap:9px; } .stat { padding:13px; } .stat-value { font-size:24px; } .panel-body { padding:14px; } .node { width:94px; } .network-row { gap:5px; } .form-grid { grid-template-columns:1fr; } .field.full { grid-column:auto; } .heading h2 { font-size:27px; } }
`;


function App() {

  const [backendConnected, setBackendConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [incident, setIncident] = useState("Medical Emergency");
  const [block, setBlock] = useState("Block A");
  const [floor, setFloor] = useState("Ground");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [lastRoute, setLastRoute] = useState("");



  useEffect(() => {
    let isMounted = true;
    let isLoading = false;

    async function loadDashboard() {
      if (isLoading) return;
      isLoading = true;

      try {
        const [networkData, alertData] = await Promise.all([
          getNetwork(),
          getAlerts(),
        ]);

        if (!isMounted) return;

        setBackendConnected(true);
        setLastUpdated(new Date());
        setNodes(networkData.nodes);

        setAlerts(
          alertData.map((alert) => ({
            ...alert,
            route: Array.isArray(alert.route)
              ? alert.route.join(" â†’ ")
              : alert.route,
          }))
        );
      } catch (error) {
        if (!isMounted) return;
        setBackendConnected(false);
        console.error("Failed to refresh FIREFLY dashboard:", error);
      } finally {
        isLoading = false;
      }
    }

    loadDashboard();

    const refreshInterval = setInterval(loadDashboard, 3000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);



  const activeRelays = nodes.filter(
    (node) => node.type === "relay" && node.online
  ).length;

  const deliveredCount = alerts.filter(
    (alert) => alert.status !== "Failed"
  ).length;


async function toggleNode(id) {
  try {
    const updatedNode = await toggleBackendNode(id);

    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, ...updatedNode } : node
      )
    );

    setNotice(
      `${id} is now ${updatedNode.online ? "ONLINE" : "OFFLINE"}. Submit an SOS to test routing.`
    );
    setNoticeError(false);
  } catch (error) {
    console.error("Node toggle failed:", error);
    setNotice(`Could not update ${id}. Check the FIREFLY backend.`);
    setNoticeError(true);
  }
}


async function submitSOS(event) {
  event.preventDefault();

  const incidentMap = {
    "Medical Emergency": "Medical",
    "Fire / Smoke": "Fire",
    "Security Threat": "Security",
    "Trapped / Locked In": "Other",
    "Other Emergency": "Other",
  };

  try {
    const result = await sendSOS({
      name: "FIREFLY Student",
      incident: incidentMap[incident] || "Other",
      block,
      floor: floor === "Ground" ? "Ground floor" : `Floor ${floor}`,
      message: incident,
    });

    const route = Array.isArray(result.route)
      ? result.route.join(" â†’ ")
      : result.route || "";

    const alert = {
      ...result,
      incident,
      route: route || "No available route to gateway",
    };

    setAlerts((current) => [alert, ...current.filter((item) => item.id !== result.id)]);
    setLastRoute(route);

    if (result.status === "Delivered") {
      setNotice(`SOS ${result.id} delivered successfully through ${route}`);
      setNoticeError(false);
    } else {
      setNotice(`SOS ${result.id} could not reach the command gateway. Check the network nodes.`);
      setNoticeError(true);
    }
  } catch (error) {
    console.error("SOS submission failed:", error);
    setNotice("Could not contact the FIREFLY backend. Check that the server is running.");
    setNoticeError(true);
  }
}

async function acknowledgeAlert(id) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/alerts/${encodeURIComponent(id)}/acknowledge`,
      { method: "PATCH" }
    );

    if (!response.ok) {
      throw new Error(`Acknowledgement failed: ${response.status}`);
    }

    const updatedAlert = await response.json();

    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              ...updatedAlert,
              incident: alert.incident,
              route: alert.route,
            }
          : alert
      )
    );

    setNotice(`Alert ${id} acknowledged in the simulation.`);
    setNoticeError(false);
  } catch (error) {
    console.error("Alert acknowledgement failed:", error);
    setNotice("Could not acknowledge the alert. Please check the backend.");
    setNoticeError(true);
  }
}



async function resetNetwork() {
  try {
    console.log("FIREFLY: Resetting network...");

    const resetResult = await resetBackendNetwork();
    console.log("FIREFLY: Reset response:", resetResult);

    const [networkData, alertData] = await Promise.all([
      getNetwork(),
      getAlerts(),
    ]);

    console.log("FIREFLY: Network data:", networkData);
    console.log("FIREFLY: Alert data:", alertData);

    setNodes(networkData.nodes);
    setAlerts(
      alertData.map((alert) => ({
        ...alert,
        route: Array.isArray(alert.route)
          ? alert.route.join(" â†’ ")
          : alert.route,
      }))
    );

    setLastRoute("");
    setNotice("Network restored. All simulated devices are online.");
    setNoticeError(false);
  } catch (error) {
    console.error("FIREFLY network reset failed:", error);
    setNotice(
      `Network reset failed: ${error.message || "Unknown error"}. Check the console.`
    );
    setNoticeError(true);
  }
}

const student = nodes.find((node) => node.type === "student");
const gateway = nodes.find((node) => node.type === "gateway");


  function renderNode(node) {
    const icons = {
      student: "â—‰",
      relay: "âŒ",
      gateway: "âŒ˜",
    };

    return (
      <div
        className={`node ${node.online ? "online" : "offline"} ${
          node.type === "student"
            ? "node-student"
            : node.type === "gateway"
              ? "node-gateway"
              : ""
        }`}
        key={node.id}
      >
        <span className="node-icon">{icons[node.type]}</span>
        <span className="node-name">{node.name}</span>
        <span className="node-id">{node.id}</span>
        <span
          className={`node-status ${
            node.online ? "online-text" : "offline-text"
          }`}
        >
          {node.online ? "â— ONLINE" : "â— OFFLINE"}
        </span>
      </div>
    );
  }

  return (
    <div className="ff">
      <style>{css}</style>

      <header className="header">
        <div className="brand">
          <div className="logo">ÏŸ</div>
          <div>
            <h1>FIREFLY</h1>
            <p>HOSTEL EMERGENCY MESH</p>
          </div>
        </div>

<div className="top-status">
  <span
    className="dot"
    style={{
      background: backendConnected ? colors.green : colors.red,
    }}
  />
  {backendConnected ? "BACKEND CONNECTED" : "BACKEND DISCONNECTED"}
  {lastUpdated && (
    <span>{" Â· UPDATED "}{lastUpdated.toLocaleTimeString()}</span>
  )}
</div>

      </header>

      <main className="main">
        <div className="heading">
          <div>
            <div className="eyebrow">Command center / Overview</div>
            <h2>Emergency Network</h2>
            <p>Monitor simulated SOS alerts, relay availability and delivery.</p>
          </div>
          <span className="badge">LOCAL DEMO Â· NO RADIO HARDWARE</span>
        </div>

        <section className="stats">
          <div className="stat">
            <div className="stat-label">Network Devices Online</div>
            <div className="stat-value">
              {nodes.filter((node) => node.online).length}
              <span style={{ color: colors.muted, fontSize: 16 }}> / 5</span>
            </div>
            <div className="stat-note">Student, relays and gateway</div>
          </div>

          <div className="stat">
            <div className="stat-label">Active Relay Nodes</div>
            <div className="stat-value" style={{ color: colors.cyan }}>
              {activeRelays}
            </div>
            <div className="stat-note">Available simulated relays</div>
          </div>

          <div className="stat">
            <div className="stat-label">SOS Alerts Recorded</div>
            <div className="stat-value">{alerts.length}</div>
            <div className="stat-note">Including previous demo alerts</div>
          </div>

          <div className="stat">
            <div className="stat-label">Successfully Routed</div>
            <div className="stat-value" style={{ color: colors.green }}>
              {deliveredCount}
            </div>
            <div className="stat-note">Delivered or acknowledged</div>
          </div>
        </section>

        <div className="layout">
          <section>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Network Topology</h3>
                  <p>Device health and simulated relay paths</p>
                </div>
                <span className="badge">
                  {activeRelays} RELAYS ACTIVE
                </span>
              </div>

              <div className="panel-body">
                <div className="network">
                  <div className="network-row">
                    {renderNode(student)}
                    <span
                      className={`link ${
                        !student.online || activeRelays === 0 ? "down" : ""
                      }`}
                    >
                      â†’
                    </span>
                    {renderNode(nodes[1])}
                    <span
                      className={`link ${
                        !nodes[1].online ? "down" : ""
                      }`}
                    >
                      â†’
                    </span>
                    {renderNode(gateway)}
                  </div>

                  <div className="network-row">
                    <span style={{ color: colors.muted, fontSize: 11 }}>
                      Alternate relay paths
                    </span>
                    <span className="link">â†˜</span>
                    {renderNode(nodes[2])}
                    <span className="link">â†—</span>
                    <span className="link">â†˜</span>
                    {renderNode(nodes[3])}
                    <span className="link">â†—</span>
                  </div>
                </div>

                <div className="network-legend">
                  <span className="legend-item">
                    <span
                      className="legend-square"
                      style={{ background: colors.green }}
                    />
                    Online
                  </span>
                  <span className="legend-item">
                    <span
                      className="legend-square"
                      style={{ background: colors.red }}
                    />
                    Offline
                  </span>
                  <span className="legend-item">
                    <span
                      className="legend-square"
                      style={{ background: colors.cyan }}
                    />
                    Relay network
                  </span>
                </div>

                <p className="hint">
                  Demo routing tries Relay North first, then Relay South, then
                  Relay Backup. This is a simplified software simulation, not a
                  physical mesh network.
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Send Emergency SOS</h3>
                  <p>Simulate a student's emergency request</p>
                </div>
                <span style={{ color: colors.cyan, fontSize: 18 }}>ÏŸ</span>
              </div>

              <div className="panel-body">
                <form onSubmit={submitSOS}>
                  <div className="form-grid">
                    <div className="field full">
                      <label htmlFor="incident">EMERGENCY TYPE</label>
                      <select
                        id="incident"
                        value={incident}
                        onChange={(event) => setIncident(event.target.value)}
                      >
                        {incidents.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="block">HOSTEL BLOCK</label>
                      <select
                        id="block"
                        value={block}
                        onChange={(event) => setBlock(event.target.value)}
                      >
                        <option>Block A</option>
                        <option>Block B</option>
                        <option>Block C</option>
                        <option>Block D</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="floor">FLOOR</label>
                      <select
                        id="floor"
                        value={floor}
                        onChange={(event) => setFloor(event.target.value)}
                      >
                        <option value="Ground">Ground floor</option>
                        <option value="1">Floor 1</option>
                        <option value="2">Floor 2</option>
                        <option value="3">Floor 3</option>
                        <option value="4">Floor 4</option>
                        <option value="5">Floor 5</option>
                      </select>
                    </div>

                    <div className="field full">
                      <button className="primary" type="submit">
                        âš¡ &nbsp; SEND EMERGENCY SOS
                      </button>
                    </div>
                  </div>
                </form>

                {notice && (
                  <div
                    className={`notice ${noticeError ? "error" : ""}`}
                    role="status"
                  >
                    {notice}
                  </div>
                )}

                {lastRoute && (
                  <p className="hint">
                    Last successful route: {lastRoute}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Live SOS Alerts</h3>
                  <p>Most recent simulated incidents first</p>
                </div>
                <span className="badge">{alerts.length} TOTAL</span>
              </div>

              <div className="alert-list">
                {alerts.length === 0 ? (
                  <div className="panel-body">
                    <p className="hint">No alerts recorded yet.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <article className="alert" key={alert.id}>
                      <div className="alert-top">
                        <div>
                          <h4>{alert.incident}</h4>
                          <p>
                            {alert.id} Â· {alert.block}, {alert.floor}
                          </p>
                          <p>{alert.time}</p>
                        </div>

                        <span
                          className={`pill ${
                            alert.status === "Failed"
                              ? "pill-failed"
                              : alert.status === "Acknowledged"
                                ? "pill-ack"
                                : "pill-delivered"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <p style={{ marginTop: 9 }}>
                        Route: {alert.route}
                      </p>

                      {alert.status === "Delivered" && (
                        <div className="alert-actions">
                          <button
                            className="secondary"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            âœ“ Acknowledge
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Device Controls</h3>
                  <p>Switch nodes offline to test failover</p>
                </div>
              </div>

              <div className="node-controls">
                {nodes.map((node) => (
                  <div className="node-control" key={node.id}>
                    <div>
                      <strong>{node.name}</strong>
                      <small>
                        {node.id} Â· {node.type}
                      </small>
                    </div>

                    <button
                      className={`toggle ${node.online ? "on" : "off"}`}
                      onClick={() => toggleNode(node.id)}
                      aria-label={`Set ${node.id} ${
                        node.online ? "offline" : "online"
                      }`}
                    >
                      {node.online ? "â— ONLINE" : "â— OFFLINE"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="panel-body">
                <button
                  className="secondary"
                  style={{ width: "100%" }}
                  onClick={resetNetwork}
                >
                  â†» Restore All Devices
                </button>
                <p className="hint">
                  Try switching Relay North offline and sending an SOS. The
                  simulator will try the next available relay.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        FIREFLY Â· EMERGENCY MESH RESEARCH PROTOTYPE Â· SOFTWARE SIMULATION ONLY
      </footer>
    </div>
  );
}

export default App;
