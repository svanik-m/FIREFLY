
from datetime import datetime
from uuid import uuid4
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="FIREFLY Emergency Mesh API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

nodes = {
    "ST-01": {"id": "ST-01", "name": "Student Device", "type": "student", "online": True},
    "RLY-01": {"id": "RLY-01", "name": "Relay North", "type": "relay", "online": True},
    "RLY-02": {"id": "RLY-02", "name": "Relay South", "type": "relay", "online": True},
    "RLY-03": {"id": "RLY-03", "name": "Relay Backup", "type": "relay", "online": True},
    "GW-01": {"id": "GW-01", "name": "Command Gateway", "type": "gateway", "online": True},
}

alerts = []


class SOSRequest(BaseModel):
    name: str
    incident: Literal["Medical", "Fire", "Security", "Other"]
    block: str
    floor: str
    message: str = ""


@app.get("/")
def root():
    return {"message": "FIREFLY API is running"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "FIREFLY"}


@app.get("/api/network")
def network():
    return {
        "nodes": list(nodes.values()),
        "online": sum(n["online"] for n in nodes.values()),
        "total": len(nodes),
    }


@app.get("/api/nodes")
def get_nodes():
    return list(nodes.values())


@app.patch("/api/nodes/{node_id}/toggle")
def toggle_node(node_id: str):
    if node_id not in nodes:
        raise HTTPException(status_code=404, detail="Node not found")
    nodes[node_id]["online"] = not nodes[node_id]["online"]
    return nodes[node_id]


@app.post("/api/sos")
def create_sos(request: SOSRequest):
    relay = next(
        (
            rid
            for rid in ("RLY-01", "RLY-02", "RLY-03")
            if nodes[rid]["online"]
        ),
        None,
    )


    # Determine the exact reason if delivery is impossible.
    if not nodes["ST-01"]["online"]:
        failure_reason = "STUDENT_DEVICE_OFFLINE"
        failure_message = "The student device is offline and cannot send the SOS."
    elif not nodes["GW-01"]["online"]:
        failure_reason = "GATEWAY_OFFLINE"
        failure_message = "The command gateway is offline and cannot receive the SOS."
    elif relay is None:
        failure_reason = "NO_AVAILABLE_RELAY"
        failure_message = "All relay nodes are offline. No route is available."
    else:
        failure_reason = None
        failure_message = None

    delivered = failure_reason is None
    route = ["ST-01", relay, "GW-01"] if delivered else []

    alert = {
        "id": f"FF-{uuid4().hex[:6].upper()}",
        "name": request.name,
        "incident": request.incident,
        "block": request.block,
        "floor": request.floor,
        "message": request.message,
        "status": "Delivered" if delivered else "Failed",
        "route": route,
        "failure_reason": failure_reason,
        "failure_message": failure_message,
        "time": datetime.now().strftime("%H:%M:%S"),
        "acknowledged": False,
    }

    alerts.insert(0, alert)
    return alert



@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    alert = next((a for a in alerts if a["id"] == alert_id), None)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["acknowledged"] = True
    alert["status"] = "Acknowledged"
    return alert


@app.post("/api/network/reset")
def reset_network():
    for node in nodes.values():
        node["online"] = True
    return {"message": "Network restored", "nodes": list(nodes.values())}

@app.get("/api/alerts")
def get_alerts():
    return alerts

@app.delete("/api/alerts")
def clear_alerts():
    alerts.clear()
    return {"message": "Alerts cleared"}
