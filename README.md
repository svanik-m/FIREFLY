## 🚨 Live SOS Sender & Receiver

FIREFLY now includes a dedicated **SOS Sender** interface and a **Live Receiver** interface alongside the main Command Center dashboard. These interfaces communicate with the FastAPI backend to demonstrate live emergency-alert delivery and acknowledgement.

### System Components

| Component | Port | Purpose |
|---|---:|---|
| FastAPI Backend | `8000` | Processes SOS alerts and broadcasts events |
| Main Dashboard | `5173` | Command Center and network monitoring |
| SOS Sender | `5174` | Sends emergency SOS alerts |
| Live Receiver | `5175` | Receives and displays alerts in real time |

### Prerequisites

- Python and the project's backend virtual environment
- Node.js and npm
- Dependencies installed in the backend, `frontend`, `sos-sender`, and `live-receiver` directories

### How to Run

Start each component in a separate PowerShell terminal.

**1. Backend API**

```powershell
cd C:\Users\ssuva\FIREFLY
& .\backend\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**2. Main Command Center**

```powershell
cd C:\Users\ssuva\FIREFLY\frontend
npm run dev
```

**3. SOS Sender**

```powershell
cd C:\Users\ssuva\FIREFLY\sos-sender
npm run dev -- --host 127.0.0.1 --port 5174
```

**4. Live Receiver**

```powershell
cd C:\Users\ssuva\FIREFLY\live-receiver
npm run dev -- --host 127.0.0.1 --port 5175
```

### Access the Interfaces

- **Command Center:** http://127.0.0.1:5173
- **SOS Sender:** http://127.0.0.1:5174
- **Live Receiver:** http://127.0.0.1:5175
- **API Health Check:** http://127.0.0.1:8000/api/health
- **API Documentation:** http://127.0.0.1:8000/docs

### SOS Workflow

1. Start the backend and all three frontend applications.
2. Open the SOS Sender and trigger an emergency alert.
3. The backend processes the alert and broadcasts the relevant event.
4. The Live Receiver displays the incoming alert without requiring a manual refresh when the live connection is working.
5. Acknowledge the alert and verify the updated status in the system.

### Important Notes

- Keep the backend running while testing the frontends.
- If an interface cannot connect, verify that the backend is available and that the frontend API configuration points to the correct backend address.
- This project currently demonstrates an emergency-response workflow. Simulated network routes and local testing do not establish real-world emergency-service reliability.
