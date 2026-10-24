# FIREFLY — Emergency Network Simulation

FIREFLY is a software simulation of an emergency communication network designed to demonstrate how SOS messages can travel through relay nodes to a gateway.

The project simulates emergency message delivery, relay failover, network failures, and recovery through an interactive dashboard.

## Key Features

- Emergency SOS message generation and delivery tracking
- Automatic relay failover when a relay becomes unavailable
- Simulation of offline student devices, relays, and gateways
- Interactive network dashboard and device controls
- Event Timeline with event filters
- Alert acknowledgement
- Network reset and recovery

## Technology Stack

- **Frontend:** React and Vite
- **Backend:** Python and FastAPI
- **API Server:** Uvicorn
- **Version Control:** Git and GitHub

## Project Structure

```text
FIREFLY/
├── backend/
│   ├── main.py
│   └── .venv/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

### Main Components

- **backend/main.py:** Handles the API and emergency network simulation.
- **frontend/src/:** Contains the React frontend components and interface.
- **README.md:** Explains the project and how to run it.
- **.gitignore:** Specifies files Git should ignore.

## How to Run FIREFLY

### 1. Start the Backend

Open a terminal in VS Code and run:

```powershell
cd C:\Users\ssuva\FIREFLY\backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend API will run at:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 2. Start the Frontend

Open a **second terminal** in VS Code. Keep the backend terminal running.

Run:

```powershell
cd C:\Users\ssuva\FIREFLY\frontend
npm.cmd run dev
```

Open the local URL displayed by Vite in your browser. It is usually:

http://localhost:5173

### 3. Important

- Keep both terminals running while using the application.
- Start the backend before testing SOS delivery.
- Press `Ctrl + C` in a terminal to stop its server when finished.

## Simulation Test Scenarios

Use the FIREFLY dashboard to test the following scenarios.

### Test 1: Normal SOS Delivery
1. Ensure the student device, relay nodes, and gateway are online.
2. Trigger an SOS.
3. Verify that the SOS is delivered through an available relay.

### Test 2: Relay Failover
1. Disable the primary relay.
2. Trigger an SOS.
3. Verify that another online relay is selected.

### Test 3: Student Device Offline
1. Disable the student device.
2. Trigger an SOS.
3. Verify that delivery fails.

### Test 4: All Relays Offline
1. Disable all relay nodes.
2. Trigger an SOS.
3. Verify that no delivery route is available.

### Test 5: Gateway Offline
1. Disable the gateway.
2. Trigger an SOS.
3. Verify that delivery fails.

### Test 6: Network Recovery
1. Use the network reset control.
2. Verify that the devices return online.
3. Trigger a new SOS and confirm delivery.

### Test 7: Event Timeline
1. Generate successful and failed SOS events.
2. Use the timeline filters.
3. Verify that the displayed events match the selected filter.

## Limitations

FIREFLY is a software simulation for demonstration and testing. It is not a production emergency-response system. Simulation events and state may be stored in memory and can reset when the backend restarts.