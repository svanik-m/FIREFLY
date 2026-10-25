import { useEffect, useState } from "react";
import {
  getNetwork,
  getAlerts,
  getEvents,
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
    route: "ST-01 -> RLY-01 -> GW-01",
  },
  {
    id: "FF-104276",
    incident: "Security Threat",
    block: "Block C",
    floor: "Floor 1",
    time: "12:38:41",
    status: "Acknowledged",
    route: "ST-01 -> RLY-02 -> GW-01",
  },
];

const colors = {
  bg: "#080B10",
  panel: "#141920",
  border: "#303943",
  text: "#E8EDF4",
  muted: "#98A4B3",
  cyan: "#45E6F5",
  green: "#51E0A0",
  red: "#FF667D",
  amber: "#D6B77A",
};

const css = `

* { box-sizing: border-box; }
body { margin: 0; background: ${colors.bg}; color: ${colors.text}; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { opacity: .4; cursor: not-allowed; }
.ff { min-height: 100vh; background: radial-gradient(ellipse at 70% 0%, #111820 0%, #080B10 48%); }
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
.event-timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 420px;
  overflow-y: auto;
  padding: 8px 0;
}

.event-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.event-dot {
  width: 9px;
  height: 9px;
  min-width: 9px;
  margin-top: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px #38bdf866;
}

.event-content {
  min-width: 0;
  flex: 1;
}

.event-content strong {
  font-size: 13px;
}

.event-content p {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}


.event-filter-label {
  display: block;
  margin-bottom: 8px;
  color: ${colors.muted};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.event-filter {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 20px;
  border: 1px solid ${colors.border};
  border-radius: 9px;
  background: #0a1220;
  color: ${colors.text};
}

.event-dot-sos-created {
  background: ${colors.amber};
  box-shadow: 0 0 10px #ffc46b66;
}

.event-dot-sos-delivered {
  background: ${colors.green};
  box-shadow: 0 0 10px #51e0a066;
}

.event-dot-sos-failed {
  background: ${colors.red};
  box-shadow: 0 0 10px #ff667d66;
}

.event-dot-alert-acknowledged {
  background: ${colors.cyan};
  box-shadow: 0 0 10px #56e4f566;
}


/* ===== FIREFLY MIDNIGHT TACTICAL — POLISH LAYER ===== */

/* Cleaner page rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.ff {
  color-scheme: dark;
  background:
    radial-gradient(ellipse at 75% 0%, #151c24 0%, transparent 42%),
    #080b10;
}

/* Refined command header */
.header {
  background: rgba(8, 11, 16, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  position: relative;
}

.logo {
  border-radius: 11px;
  box-shadow: 0 0 18px #8ca3b812;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.brand h1 {
  font-weight: 800;
  line-height: 1.15;
}

.brand p {
  line-height: 1.6;
}

/* More consistent dashboard spacing */
.main {
  padding-top: 32px;
}

.heading {
  margin-bottom: 26px;
}

.heading h2 {
  font-weight: 750;
  line-height: 1.15;
}

.stats {
  gap: 16px;
}

/* Subtle card depth, without excessive glow */
.stat,
.panel {
  background: linear-gradient(145deg, #161c23, #11161c);
  border-color: #303943;
  box-shadow: 0 5px 18px #00000012;
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.stat:hover {
  border-color: #45515e;
  transform: translateY(-2px);
  box-shadow: 0 9px 24px #00000022;
}

.panel {
  border-radius: 14px;
}

.panel-head {
  background: #ffffff03;
}

.panel-head h3 {
  font-weight: 700;
  letter-spacing: 0.15px;
}

.stat-value {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.8px;
  line-height: 1.15;
}

/* Network: restrained cyan and clearer device cards */
.network {
  background-color: #0d1218;
  background-image: radial-gradient(#53617130 1px, transparent 1px);
  background-size: 20px 20px;
}

.node {
  background: #10161d;
  border-color: #36414d;
  border-radius: 11px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.node.online {
  border-color: #45e6f566;
  box-shadow: inset 0 0 18px #45e6f508;
}

.node.online:hover {
  border-color: #45e6f5bb;
  box-shadow: inset 0 0 20px #45e6f50c;
}

.node-student {
  border-color: #51e0a088 !important;
}

.node-gateway {
  border-color: #d6b77a88 !important;
}

.node.offline {
  border-color: #ff667d !important;
  background: #24151b;
  box-shadow: inset 0 0 18px #ff667d0b;
}

.link {
  color: #45e6f5;
}

/* Buttons: clear interaction states */
.primary,
.secondary,
.danger,
.toggle {
  transition:
    background 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.primary {
  background: #8ca3b8;
}

.primary:hover:not(:disabled) {
  background: #a4b8c9;
  box-shadow: 0 0 18px #8ca3b81c;
}

.secondary:hover:not(:disabled) {
  background: #1b242e;
  border-color: #526171;
}

.danger:hover:not(:disabled) {
  background: #421d28;
  border-color: #ff667d99;
}

.toggle:hover:not(:disabled) {
  border-color: #657381;
}

/* Consistent inputs */
.field input,
.field select,
.event-filter {
  background: #0b1016;
  border-color: #36414d;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.field input:focus,
.field select:focus,
.event-filter:focus {
  border-color: #8ca3b8;
  box-shadow: 0 0 0 3px #8ca3b814;
  outline: none;
}

/* Alert and event readability */
.alert {
  transition: background 160ms ease;
}

.alert:hover {
  background: #ffffff03;
}

.event-timeline {
  scrollbar-width: thin;
  scrollbar-color: #45515e #10151b;
}

.event-timeline::-webkit-scrollbar {
  width: 6px;
}

.event-timeline::-webkit-scrollbar-thumb {
  background: #45515e;
  border-radius: 8px;
}

.event-dot {
  background: #45e6f5;
  box-shadow: 0 0 8px #45e6f533;
}

.event-dot-sos-created {
  background: #d6b77a;
  box-shadow: 0 0 8px #d6b77a33;
}

.event-dot-sos-delivered {
  background: #51e0a0;
  box-shadow: 0 0 8px #51e0a033;
}

.event-dot-sos-failed {
  background: #ff667d;
  box-shadow: 0 0 8px #ff667d33;
}

.event-dot-alert-acknowledged {
  background: #45e6f5;
  box-shadow: 0 0 8px #45e6f533;
}

/* Keyboard accessibility */
.ff button:focus-visible,
.ff input:focus-visible,
.ff select:focus-visible {
  outline: 2px solid #45e6f5;
  outline-offset: 3px;
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  .ff *,
  .ff *::before,
  .ff *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Smaller screens */
@media (max-width: 850px) {
  .main {
    padding-top: 24px;
  }

  .stats {
    gap: 12px;
  }

  .stat:hover {
    transform: none;
  }
}

@media (max-width: 520px) {
  .main {
    padding-top: 20px;
  }

  .header {
    gap: 12px;
  }

  .brand h1 {
    font-size: 20px;
    letter-spacing: 3px;
  }

  .top-status {
    padding: 8px 10px;
  }

  .stats {
    gap: 9px;
  }

  .panel-head {
    padding: 15px;
  }

  .network {
    padding-left: 5px;
    padding-right: 5px;
  }
}

/* ===== FIREFLY PASS 1: CYAN COMMAND HIERARCHY ===== */

/* Brighter futuristic cyan accent */
.ff {
  --ff-cyan: #45e6f5;
  --ff-cyan-soft: #45e6f51c;
  --ff-cyan-border: #45e6f555;
}

/* Dashboard heading */
.heading h2 {
  font-size: clamp(28px, 3.2vw, 38px);
  font-weight: 800;
  letter-spacing: -1.2px;
  line-height: 1.12;
  text-shadow: 0 0 24px #45e6f510;
}

.eyebrow {
  color: #45e6f5;
  letter-spacing: 2.4px;
}

.heading p {
  line-height: 1.7;
}

/* Metric card refinement */
.stats {
  gap: 15px;
}

.stat {
  position: relative;
  isolation: isolate;
  min-width: 0;
  padding: 20px;
  background:
    linear-gradient(135deg, #182129 0%, #11171e 65%, #10151b 100%);
  border: 1px solid #34424e;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 #ffffff06;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

/* Restrained cyan highlight along the top edge */
.stat::before {
  content: "";
  position: absolute;
  z-index: -1;
  top: 0;
  left: 14%;
  width: 72%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    #45e6f577,
    transparent
  );
}

.stat:hover {
  border-color: #45e6f566;
  box-shadow:
    inset 0 1px 0 #ffffff08,
    0 0 24px #45e6f50b;
  transform: translateY(-2px);
}

.stat-label {
  color: #aab8c7;
  font-size: 12px;
  font-weight: 550;
  letter-spacing: 0.25px;
  line-height: 1.5;
}

.stat-value {
  margin: 13px 0 8px;
  font-size: clamp(27px, 2.2vw, 33px);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-note {
  color: #91a1b2;
  font-size: 11px;
  line-height: 1.6;
}

/* Make primary cyan accents consistently brighter */
.ff .eyebrow,
.ff .link {
  color: #45e6f5;
}

/* Keep small labels readable */
.badge {
  color: #b0bfce;
  border-color: #344653;
  letter-spacing: 0.25px;
}

/* Preserve the card layout on smaller screens */
@media (max-width: 850px) {
  .stat {
    padding: 17px;
  }

.stat:hover {
    transform: none;
  }
}

@media (max-width: 520px) {
  .stat {
    padding: 13px;
    border-radius: 11px;
  }

.stat-value {
    font-size: 25px;
    margin: 10px 0 6px;
  }

.stat-label {
    font-size: 11px;
  }

.stat-note {
    font-size: 10px;
  }
}

/* ===== FIREFLY PASS 2: NETWORK TOPOLOGY ===== */

.network {
  position: relative;
  isolation: isolate;
  background-color: #0b1118;
  background-image:
    linear-gradient(#45e6f508 1px, transparent 1px),
    linear-gradient(90deg, #45e6f508 1px, transparent 1px),
    radial-gradient(#53677955 1px, transparent 1px);
  background-size: 36px 36px, 36px 36px, 18px 18px;
  border: 1px solid #263642;
  border-radius: 12px;
}

/* Device cards */
.node {
  position: relative;
  background: linear-gradient(145deg, #131e27, #0c131a);
  border: 1px solid #40515e;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 #ffffff08;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.node.online {
  border-color: #45e6f588;
  box-shadow:
    inset 0 0 22px #45e6f508,
    0 0 12px #45e6f508;
}

.node.online:hover {
  border-color: #45e6f5;
  box-shadow:
    inset 0 0 24px #45e6f510,
    0 0 18px #45e6f51a;
  transform: translateY(-2px);
}

/* Preserve semantic colors for special devices */
.node.node-student {
  border-color: #51e0a0bb !important;
}

.node.node-gateway {
  border-color: #d6b77abb !important;
}

/* Offline state remains unmistakably red */
.node.offline {
  border-color: #ff667d !important;
  background: linear-gradient(145deg, #301821, #191116);
  box-shadow: inset 0 0 20px #ff667d0c;
  opacity: 1;
}

.node-name {
  font-size: 11px;
  font-weight: 750;
  line-height: 1.45;
}

.node-id {
  color: #a3b4c4;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.35px;
}

.node-status {
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 1.2px;
}

.online-text {
  color: #51e0a0;
}

.offline-text {
  color: #ff667d;
}

/* Connection arrows and failover path indicators */
.link {
  color: #45e6f5;
  font-size: 20px;
  font-weight: 800;
  text-shadow: 0 0 12px #45e6f555;
}

.link.down {
  color: #ff667d;
  text-shadow: 0 0 12px #ff667d44;
}

.network-legend {
  gap: 20px;
  line-height: 1.7;
}

.legend-square {
  box-shadow: 0 0 8px currentColor;
}

@media (max-width: 520px) {
  .node {
    width: 94px;
    padding: 10px 5px;
  }

.node-name {
    font-size: 10px;
  }

.network {
    background-size: 30px 30px, 30px 30px, 15px 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .node,
  .node.online:hover {
    transform: none;
  }
}


/* ===== FIREFLY PASS 3: INCIDENTS & EVENT TIMELINE ===== */

/* Alert panel readability */
.panel-head h3 {
  font-weight: 750;
  letter-spacing: 0.1px;
}

.panel-head p {
  color: #a2b2c2;
  line-height: 1.6;
}

.alert-list {
  gap: 0;
}

.alert {
  padding: 18px 20px;
  border-bottom: 1px solid #293641;
  transition: background 180ms ease;
}

.alert:hover {
  background: #45e6f506;
}

.alert-top {
  align-items: flex-start;
}

.alert h4 {
  color: #edf5fc;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.45;
}

.alert p {
  color: #a4b4c4;
  font-size: 11px;
  line-height: 1.75;
}

/* Incident status pills */
.pill {
  padding: 5px 9px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.35px;
}

.pill-delivered {
  background: #153a32;
  border-color: #51e0a044;
  color: #51e0a0;
}

.pill-ack {
  background: #12313a;
  border-color: #45e6f555;
  color: #45e6f5;
}

.pill-failed {
  background: #3b2029;
  border-color: #ff667d66;
  color: #ff91a1;
}

/* Timeline layout */
.event-timeline {
  gap: 0;
  max-height: 440px;
  padding: 4px 2px 4px 0;
  scrollbar-width: thin;
  scrollbar-color: #40515f #0d1218;
}

.event-item {
  position: relative;
  gap: 13px;
  padding: 13px 8px 16px 2px;
  border-bottom: 1px solid #29364188;
}

.event-item:last-child {
  border-bottom: 0;
}

.event-dot {
  position: relative;
  z-index: 1;
  width: 9px;
  min-width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 50%;
  background: #45e6f5;
  box-shadow: 0 0 11px #45e6f544;
}

.event-content {
  min-width: 0;
}

.event-content strong {
  display: block;
  color: #eaf3fb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15px;
  line-height: 1.6;
}

.event-content p {
  margin: 5px 0;
  color: #b0bfce;
  font-size: 11px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.event-content small {
  color: #8ea2b4;
  font-size: 10px;
  line-height: 1.6;
}

/* Event types retain their semantic colors */
.event-dot-sos-created {
  background: #d6b77a;
  box-shadow: 0 0 10px #d6b77a44;
}

.event-dot-sos-delivered {
  background: #51e0a0;
  box-shadow: 0 0 10px #51e0a044;
}

.event-dot-sos-failed {
  background: #ff667d;
  box-shadow: 0 0 10px #ff667d44;
}

.event-dot-alert-acknowledged {
  background: #45e6f5;
  box-shadow: 0 0 10px #45e6f544;
}

/* Event filter */
.event-filter-label {
  color: #aebdcb;
  font-size: 10px;
  letter-spacing: 1.2px;
}

.event-filter {
  background-color: #0b1118;
  border-color: #354754;
  border-radius: 9px;
  color: #e8edf4;
}

.event-filter:hover {
  border-color: #45e6f588;
}

.event-filter:focus-visible {
  outline: 2px solid #45e6f5;
  outline-offset: 2px;
}

/* Alert action buttons */
.alert-actions {
  gap: 9px;
  margin-top: 14px;
}

.alert-actions button {
  min-height: 32px;
}

@media (max-width: 520px) {
  .alert {
    padding: 15px;
  }

.alert-top {
    gap: 8px;
  }

.event-item {
    gap: 10px;
    padding: 12px 4px 14px 0;
  }

.event-content p {
    font-size: 11px;
  }

.pill {
    padding: 5px 7px;
    font-size: 8px;
  }
}

/* ===== FIREFLY MIDNIGHT TACTICAL: CONTROLS & RESPONSIVE POLISH ===== */
.primary {
  background: linear-gradient(135deg, #55edf8, #27c9df);
  color: #071219;
  font-weight: 850;
  letter-spacing: .35px;
  box-shadow: 0 0 0 1px #45e6f522;
  transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}
.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #82f4fc, #45e6f5);
  box-shadow: 0 0 22px #45e6f52b;
  transform: translateY(-1px);
}
.secondary {
  background: #131e28;
  border-color: #3b4d5b;
  color: #dce8f2;
  transition: background 160ms ease, border-color 160ms ease;
}
.secondary:hover:not(:disabled) {
  background: #1b2a36;
  border-color: #45e6f588;
}
.danger { transition: background 160ms ease, border-color 160ms ease; }
.danger:hover:not(:disabled) {
  background: #421d28;
  border-color: #ff667d99;
}
.field label, .event-filter-label {
  font-weight: 750;
  letter-spacing: 1px;
}
.field input, .field select, .event-filter {
  min-height: 43px;
  background: #0a1118;
  border-color: #354754;
  color: #e8edf4;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.field input:hover, .field select:hover, .event-filter:hover {
  border-color: #45e6f577;
}
.field input:focus, .field select:focus, .event-filter:focus {
  border-color: #45e6f5;
  box-shadow: 0 0 0 3px #45e6f518;
  outline: none;
}
.toggle {
  min-width: 76px;
  font-weight: 800;
  letter-spacing: .3px;
  transition: background 160ms ease, border-color 160ms ease;
}
.toggle.on { color: #51e0a0; background: #123329; border-color: #51e0a077; }
.toggle.off { color: #ff91a1; background: #351a23; border-color: #ff667d77; }
.toggle:hover:not(:disabled) { border-color: #45e6f5; }
.node-control { transition: background 160ms ease; }
.node-control:hover { background: #45e6f506; }
.notice {
  border-color: #45e6f555;
  background: #10232b;
  color: #72eff8;
  overflow-wrap: anywhere;
}
.notice.error { border-color: #ff667d77; background: #301821; color: #ff91a1; }
@media (max-width: 850px) {
  .layout { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 520px) {
  .primary { padding: 13px 10px; font-size: 12px; }
  .node-control { padding: 13px 14px; }
  .panel-head { gap: 8px; }
  .top-status { max-width: 100%; flex-wrap: wrap; overflow-wrap: anywhere; }
}

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
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("ALL");



  useEffect(() => {
    let isMounted = true;
    let isLoading = false;

    async function loadDashboard() {
      if (isLoading) return;
      isLoading = true;

      try {
        const [networkData, alertData, eventData] = await Promise.all([
          getNetwork(),
          getAlerts(),
          getEvents(),
        ])
      if (!isMounted) return;

      setBackendConnected(true);
      setLastUpdated(new Date());
      setNodes(networkData.nodes);
      setEvents(eventData);
        setAlerts(
          alertData.map((alert) => ({
            ...alert,
            route: Array.isArray(alert.route)
              ? alert.route.join(" -> ")
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
      ? result.route.join(" -> ")
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
    const API_BASE = import.meta.env.DEV
      ? "http://127.0.0.1:8000"
      : "https://firefly-backend-36rk.onrender.com";

    const response = await fetch(
      `${API_BASE}/api/alerts/${encodeURIComponent(id)}/acknowledge`,
      { method: "POST" }
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

const [networkData, alertData, eventData] = await Promise.all([
  getNetwork(),
  getAlerts(),
  getEvents(),
]);

    console.log("FIREFLY: Network data:", networkData);
    console.log("FIREFLY: Alert data:", alertData);

    setNodes(networkData.nodes);
    setAlerts(
      alertData.map((alert) => ({
        ...alert,
        route: Array.isArray(alert.route)
          ? alert.route.join(" -> ")
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
  if (!node) return null;

  const icons = {
    student: "S",
    relay: "R",
    gateway: "G",
  };

  const signal = node.signal_dbm;
  const latency = node.latency_ms;
  const battery = node.battery_percent;
  const delivery = node.packet_delivery_percent;
  const health = node.health_score;
  const hasMetrics =
    signal != null &&
    latency != null &&
    battery != null &&
    delivery != null &&
    health != null;

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
      title={`${node.name} — ${
        node.health_status || (node.online ? "Online" : "Offline")
      }`}
    >
      <span className="node-icon">{icons[node.type] || "?"}</span>
      <span className="node-name">{node.name}</span>
      <span className="node-id">{node.id}</span>

      <span
        className={`node-status ${
          node.online ? "online-text" : "offline-text"
        }`}
      >
        {node.online ? "ONLINE" : "OFFLINE"}
      </span>

      {hasMetrics && (
        <div
          style={{
            width: "100%",
            marginTop: 5,
            paddingTop: 7,
            borderTop: "1px solid #293641",
            fontSize: 10,
            lineHeight: 1.8,
            color: "#a2b2c2",
          }}
        >
          <div>Health: <strong>{health}/100</strong></div>
          <div>Signal: {signal} dBm</div>
          <div>Latency: {latency} ms</div>
          <div>Battery: {battery}%</div>
          <div>Delivery: {delivery}%</div>
          <div
            style={{
              color: node.online ? "#51e0a0" : "#ff667d",
              fontWeight: 700,
            }}
          >
            {node.health_status || (node.online ? "Healthy" : "Offline")}
          </div>
        </div>
      )}
    </div>
  );
}

  const filteredEvents = events.filter((event) => {
  return eventFilter === "ALL" || event.type === eventFilter;
});

  return (
    <div className="ff">
      <style>{css}</style>

      <header className="header">
        <div className="brand">
          <div className="logo">FF</div>
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
  <span>
    {" | UPDATED "}
    {lastUpdated.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).replace(/\//g, "-")}
  </span>
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
          <span className="badge">LOCAL DEMO | NO RADIO HARDWARE</span>
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
                      {"->"}
                    </span>
                    {renderNode(nodes[1])}
                    <span
                      className={`link ${
                        !nodes[1].online ? "down" : ""
                      }`}
                    >
                      {"->"}
                    </span>
                    {renderNode(gateway)}
                  </div>

                  <div className="network-row">
                    <span style={{ color: colors.muted, fontSize: 11 }}>
                      Alternate relay paths
                    </span>
                    <span className="link">v</span>
                    {renderNode(nodes[2])}
                    <span className="link">{"<->"}</span>
                    <span className="link">v</span>
                    {renderNode(nodes[3])}
                    <span className="link">{"<->"}</span>
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
                    FIREFLY evaluates available relays using simulated signal quality,
                    latency, battery level and packet delivery estimates. If a relay
                    goes offline, SOS routing selects the highest-scoring available
                    alternative. Metrics are simulated; no physical radio hardware
                    is connected.
                  </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Send Emergency SOS</h3>
                  <p>Simulate a student's emergency request</p>
                </div>
                <span style={{ color: colors.cyan, fontSize: 18 }}>FF</span>
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
                        SOS: &nbsp; SEND EMERGENCY SOS
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
                            {alert.id} | {alert.block}, {alert.floor}
                          </p>
                          <p>
                          {alert.timestamp
                            ? new Date(alert.timestamp).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                              }).replace(/\//g, "-")
                            : alert.time}
                          </p>
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
                            OK - Acknowledge
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
                  <h3>Event Timeline</h3>
                  <p>Latest FIREFLY network events</p>
                </div>
                <span className="badge">
                  {filteredEvents.length} EVENTS
                </span>
              </div>

              <div className="panel-body">
                <label
                  className="event-filter-label"
                  htmlFor="event-filter"
                >
                  FILTER EVENTS
                </label>

                
                <select
                  id="event-filter"
                  className="event-filter"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="ALL">All Events</option>
                  <option value="SOS_CREATED">SOS Created</option>
                  <option value="SOS_DELIVERED">SOS Delivered</option>
                  <option value="SOS_FAILED">SOS Failed</option>
                  <option value="NODE_OFFLINE">Node Offline</option>
                  <option value="NODE_ONLINE">Node Online</option>
                  <option value="RELAY_FAILOVER">Relay Failover</option>
                  <option value="NETWORK_RESET">Network Reset</option>
                  <option value="ALERT_ACKNOWLEDGED">Acknowledged</option>
                </select>

                <div className="event-timeline">
                  {filteredEvents.length === 0 ? (
                    <p className="hint">No events match this filter.</p>
                  ) : (
                    filteredEvents.slice(0, 20).map((event) => (
                      <div className="event-item" key={event.id}>
                        <span
                          className={`event-dot event-dot-${event.type
                            .toLowerCase()
                            .replaceAll("_", "-")}`}
                        />

                        <div className="event-content">
                          <strong>
                            {event.type.replaceAll("_", " ")}
                          </strong>
                          <p>{event.message}</p>

                       <span className="hint">
                             {new Date(event.timestamp).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                            })}
                          </span> 
                          {event.alert_id && (
                            <p className="hint">
                              Alert ID: {event.alert_id}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                        {node.id} | {node.type}
                      </small>
                    </div>

                    <button
                      className={`toggle ${node.online ? "on" : "off"}`}
                      onClick={() => toggleNode(node.id)}
                      aria-label={`Set ${node.id} ${
                        node.online ? "offline" : "online"
                      }`}
                    >
                      {node.online ? "ONLINE" : "OFFLINE"}
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
                  RESET: Restore All Devices
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
        FIREFLY | EMERGENCY MESH RESEARCH PROTOTYPE | SOFTWARE SIMULATION ONLY
      </footer>
    </div>
  );
}

export default App;
