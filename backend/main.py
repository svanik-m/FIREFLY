
from datetime import datetime
from uuid import uuid4
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="FIREFLY Emergency Mesh API")

IST = ZoneInfo("Asia/Kolkata")
METRICS_SOURCE = "simulated"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://firefly-frontend-e32m.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo network nodes. Online status is controlled by the API.
nodes = {
    "ST-01": {
        "id": "ST-01",
        "name": "Student Device",
        "type": "student",
        "online": True,
    },
    "RLY-01": {
        "id": "RLY-01",
        "name": "Relay North",
        "type": "relay",
        "online": True,
    },
    "RLY-02": {
        "id": "RLY-02",
        "name": "Relay South",
        "type": "relay",
        "online": True,
    },
    "RLY-03": {
        "id": "RLY-03",
        "name": "Relay Backup",
        "type": "relay",
        "online": True,
    },
    "GW-01": {
        "id": "GW-01",
        "name": "Command Gateway",
        "type": "gateway",
        "online": True,
    },
}

# Fixed demonstration metrics, not physical radio measurements.
simulated_metrics = {
    "ST-01": {
        "signal_dbm": -51,
        "latency_ms": 12,
        "battery_percent": 92,
        "packet_delivery_percent": 99.1,
    },
    "RLY-01": {
        "signal_dbm": -49,
        "latency_ms": 18,
        "battery_percent": 88,
        "packet_delivery_percent": 99.3,
    },
    "RLY-02": {
        "signal_dbm": -61,
        "latency_ms": 27,
        "battery_percent": 76,
        "packet_delivery_percent": 97.8,
    },
    "RLY-03": {
        "signal_dbm": -55,
        "latency_ms": 22,
        "battery_percent": 93,
        "packet_delivery_percent": 98.7,
    },
    "GW-01": {
        "signal_dbm": -47,
        "latency_ms": 10,
        "battery_percent": 100,
        "packet_delivery_percent": 99.5,
    },
}

alerts = []
events = []


def now_ist():
    return datetime.now(IST)


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def calculate_node_health(node_id):
    """Calculate a demo health score from the simulated node metrics."""
    node = nodes[node_id]

    if not node["online"]:
        return 0

    metrics = simulated_metrics[node_id]

    signal_score = clamp(
        (metrics["signal_dbm"] + 100) / 60 * 100
    )
    latency_score = clamp(
        (150 - metrics["latency_ms"]) / 150 * 100
    )

    score = (
        metrics["packet_delivery_percent"] * 0.40
        + signal_score * 0.25
        + latency_score * 0.20
        + metrics["battery_percent"] * 0.15
    )

    return round(score)


def serialize_node(node_id):
    """Return a node with its simulated intelligence fields."""
    node = dict(nodes[node_id])
    metrics = dict(simulated_metrics[node_id])
    health_score = calculate_node_health(node_id)

    if not node["online"]:
        health_status = "Offline"
    elif health_score >= 85:
        health_status = "Healthy"
    elif health_score >= 65:
        health_status = "Degraded"
    else:
        health_status = "Critical"

    node.update(metrics)
    node["health_score"] = health_score
    node["health_status"] = health_status
    node["metrics_source"] = METRICS_SOURCE

    return node


def log_event(event_type: str, message: str, alert_id: str = None):
    event = {
        "id": f"EV-{uuid4().hex[:8].upper()}",
        "type": event_type,
        "message": message,
        "alert_id": alert_id,
        "timestamp": now_ist().isoformat(timespec="seconds"),
    }

    events.insert(0, event)
    del events[500:]

    return event


def relay_quality_score(relay_id):
    """Higher score means a better simulated relay candidate."""
    metrics = simulated_metrics[relay_id]

    signal_score = clamp(
        (metrics["signal_dbm"] + 100) / 60 * 100
    )
    latency_score = clamp(
        (150 - metrics["latency_ms"]) / 150 * 100
    )

    return (
        metrics["packet_delivery_percent"] * 0.40
        + signal_score * 0.25
        + latency_score * 0.20
        + metrics["battery_percent"] * 0.15
    )


def select_best_relay():
    """Choose the highest-scoring online relay."""
    candidates = [
        relay_id
        for relay_id in ("RLY-01", "RLY-02", "RLY-03")
        if nodes[relay_id]["online"]
    ]

    if not candidates:
        return None

    return max(candidates, key=relay_quality_score)


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
    serialized_nodes = [
        serialize_node(node_id) for node_id in nodes
    ]

    online_count = sum(node["online"] for node in serialized_nodes)
    online_metrics = [
        node for node in serialized_nodes if node["online"]
    ]

    avg_latency = (
        round(
            sum(node["latency_ms"] for node in online_metrics)
            / len(online_metrics),
            1,
        )
        if online_metrics else None
    )

    avg_signal = (
        round(
            sum(node["signal_dbm"] for node in online_metrics)
            / len(online_metrics),
            1,
        )
        if online_metrics else None
    )

    avg_delivery = (
        round(
            sum(
                node["packet_delivery_percent"]
                for node in online_metrics
            ) / len(online_metrics),
            1,
        )
        if online_metrics else None
    )

    avg_health = (
        round(
            sum(node["health_score"] for node in online_metrics)
            / len(online_metrics)
        )
        if online_metrics else 0
    )

    return {
        "nodes": serialized_nodes,
        "online": online_count,
        "total": len(nodes),
        "metrics_source": METRICS_SOURCE,
        "average_latency_ms": avg_latency,
        "average_signal_dbm": avg_signal,
        "average_packet_delivery_percent": avg_delivery,
        "average_health_score": avg_health,
    }


@app.get("/api/nodes")
def get_nodes():
    return [
        serialize_node(node_id) for node_id in nodes
    ]


@app.patch("/api/nodes/{node_id}/toggle")
def toggle_node(node_id: str):
    if node_id not in nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    nodes[node_id]["online"] = not nodes[node_id]["online"]

    if nodes[node_id]["online"]:
        log_event(
            "NODE_ONLINE",
            f"{node_id} ({nodes[node_id]['name']}) is back online",
        )
    else:
        log_event(
            "NODE_OFFLINE",
            f"{node_id} ({nodes[node_id]['name']}) went offline",
        )

    return serialize_node(node_id)


@app.post("/api/sos")
def create_sos(request: SOSRequest):
    timestamp = now_ist()

    relay = select_best_relay() if (
        nodes["ST-01"]["online"] and nodes["GW-01"]["online"]
    ) else None

    delivered = relay is not None

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
        "failure_message": (
            None if delivered
            else "Student device, gateway, or all relay nodes are unavailable"
        ),
        "time": timestamp.strftime("%H:%M:%S"),
        "timestamp": timestamp.isoformat(timespec="seconds"),
        "acknowledged": False,
        "metrics_source": METRICS_SOURCE,
        "selected_relay": relay,
        "route_quality_score": (
            round(relay_quality_score(relay))
            if relay else None
        ),
        "estimated_route_latency_ms": (
            sum(simulated_metrics[node_id]["latency_ms"] for node_id in route)
            if delivered else None
        ),
        "estimated_packet_delivery_percent": (
            round(
                min(
                    simulated_metrics[node_id]["packet_delivery_percent"]
                    for node_id in route
                ),
                1,
            )
            if delivered else None
        ),
    }

    alerts.insert(0, alert)

    log_event(
        "SOS_CREATED",
        f"{request.incident} SOS created for {request.block}, {request.floor}",
        alert["id"],
    )

    if delivered:
        if relay != "RLY-01":
            log_event(
                "RELAY_FAILOVER",
                f"Automatic relay selection chose {relay}; RLY-01 was not selected",
                alert["id"],
            )

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
    alert = next(
        (item for item in alerts if item["id"] == alert_id),
        None,
    )

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

    log_event(
        "NETWORK_RESET",
        "All network nodes were restored to online status",
    )

    return {
        "message": "Network restored",
        "nodes": [serialize_node(node_id) for node_id in nodes],
    }


@app.get("/api/alerts")
def get_alerts():
    return alerts


@app.get("/api/events")
def get_events():
    return events


@app.delete("/api/alerts")
def clear_alerts():
    alerts.clear()
    log_event("ALERTS_CLEARED", "Alert history was cleared")
    return {"message": "Alerts cleared"}
