
from datetime import datetime
from uuid import uuid4
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from zoneinfo import ZoneInfo

app = FastAPI(title="FIREFLY Emergency Mesh API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://firefly-frontend-e32m.onrender.com",
    ],
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

events = []


def log_event(event_type: str, message: str, alert_id: str = None):
    event = {
        "id": f"EV-{uuid4().hex[:8].upper()}",
        "type": event_type,
        "message": message,
        "alert_id": alert_id,
        "timestamp": datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(timespec="seconds"),   
    }

    events.insert(0, event)

    # Keep the latest 500 events in memory.
    del events[500:]

    return event


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

    delivered = (
        nodes["ST-01"]["online"]
        and nodes["GW-01"]["online"]
        and relay is not None
    )

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
        "failure_reason": None if delivered else "Network unavailable",
        "failure_message": None if delivered else "No available route to gateway",
        "time": datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%H:%M:%S"),
        "acknowledged": False,
    }

    alerts.insert(0, alert)

    log_event(
        "SOS_CREATED",
        f"{request.incident} SOS created for {request.block}, {request.floor}",
        alert["id"],
    )

    if delivered:
        log_event(
            "SOS_DELIVERED",
            f"SOS routed through {' -> '.join(route)}",
            alert["id"],
        )
    else:
        log_event(
            "SOS_FAILED",
            "SOS could not reach the command gateway",
            alert["id"],
        )

    return alert

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    alert = next((a for a in alerts if a["id"] == alert_id), None)

    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    if not alert["acknowledged"]:
        alert["acknowledged"] = True
        alert["status"] = "Acknowledged"

        log_event(
            "ALERT_ACKNOWLEDGED",
            f"Alert {alert_id} was acknowledged",
            alert_id,
        )

    return alert

@app.post("/api/network/reset")
def reset_network():
    for node in nodes.values():
        node["online"] = True
    return {"message": "Network restored", "nodes": list(nodes.values())}

@app.get("/api/alerts")
def get_alerts():
    return alerts

@app.get("/api/events")
def get_events():
    return events

@app.delete("/api/alerts")
def clear_alerts():
    alerts.clear()
    return {"message": "Alerts cleared"}
