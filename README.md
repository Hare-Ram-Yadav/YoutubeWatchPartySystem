# 🎥 YouTube Watch Party Application

Here is the link to go to public website : https://youtubewatchpartysystem.onrender.com/

A full-stack, real-time synchronized YouTube watch party system built with **React**, **TypeScript**, **Vite**, **Node.js**, **Express**, **Socket.IO (WebSockets)**, and **SQLite** for state persistence.

---

## 🌟 Key Features & PDF Implementation Summary

### 1. Rooms & Participant Management
- **Room Creation & Join**: Create a room with custom titles and initial YouTube videos. Creator automatically becomes **Host**. Anyone can join using a unique 6-character room code (e.g., `WK8F2A`) or link.
- **Participant Roles & RBAC**:
  - 👑 **Host**: Complete control over play/pause, seek, changing video, promoting/demoting roles, kicking users, and transferring room ownership.
  - 🛡️ **Moderator**: Direct playback controls (play/pause, seek, change video). Optionally allowed to manage participant roles.
  - 👤 **Participant**: Watch-only playback controls with real-time video sync. Can submit **Action Requests** to Host/Moderators.
- **Backend Authorization**: All WebSocket events enforce role permissions on the server before mutating room state. UI buttons alone do not dictate security.
- **Persistence**: Rooms, active states, chat messages, and pending requests are persisted in SQLite (`watch_party.db`).

### 2. Real-Time Synchronized Playback
- **YouTube IFrame API**: Embedded video player driven by WebSocket state broadcasting.
- **Echo Cancellation & Feedback Loop Prevention**: Uses an `isRemoteUpdate` flag during incoming WebSocket events to avoid feedback loops from local player event listeners.
- **Drift Correction & Catchup**: Automatically resynchronizes playback timestamp if local time drifts from server time by more than 1.5 seconds.
- **Late Joiners Sync**: New or reconnecting clients automatically sync to calculated server playback time upon room entry.

### 3. Participant Action Request System
- Watch-only participants can click **"Request Video Change"** or **"Request Play/Pause"**.
- Requests trigger a pending banner for Host and Moderators with **Approve** and **Reject** buttons.
- Approved requests execute immediately for all clients in the room.

### 4. Live Room Chat & Emoji Reactions
- Real-time text chat with user role badges (`Host`, `Moderator`, `Participant`).
- Floating animated emoji reactions (`👍`, `🔥`, `🎉`, `❤️`, `👏`, `🚀`) rendered across the video player interface.

---

## 🏗️ Architecture & OOP Module Design

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client (Vite)                      │
│  - YouTube Player (IFrame API & Echo Cancellation)          │
│  - Watch Room Layout (Desktop Split View + Mobile Responsive)│
│  - Permission & Role State Hook                              │
│  - Modals (Change Video, Role Assign, Transfer Host)        │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTP REST (Auth/Rooms)      │ WebSocket (Socket.IO)
               ▼                              │ Real-Time Events
┌─────────────────────────────────────────────┴───────────────┐
│                    Node.js Express Server                   │
│  - Auth & Room REST Routes                                  │
│  - Socket.IO Gateway & RBAC Validator                       │
│  - OOP Domain: RoomManager, Room, Participant, Handlers     │
└──────────────┬──────────────────────────────────────────────┘
               │ SQL Queries
               ▼
┌─────────────────────────────────────────────────────────────┐
│                     SQLite Database                         │
│  - Tables: users, rooms, room_participants, chats, requests │
└─────────────────────────────────────────────────────────────┘
```

### OOP Backend Structure
- `Participant`: Encapsulates user socket ID, username, avatar, role, and online state.
- `Room`: Manages room state, calculates timestamp drift compensation, handles RBAC checks, processes action request queues, and syncs to SQLite.
- `RoomManager`: Singleton pattern managing in-memory active rooms with SQLite DB restoration on server start.
- `socketHandler`: Listens for WebSocket events, enforces backend role verification, and broadcasts updates.

---

## ⚡ WebSocket Event Specification

| Event | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `join_room` | Client $\rightarrow$ Server | `{ roomId, userId, username }` | User enters room |
| `user_joined` | Server $\rightarrow$ Room | `{ participant, roomState }` | Broadcast new participant |
| `playback_action` | Client $\rightarrow$ Server | `{ action: 'play'\|'pause'\|'seek'\|'change_video', videoId, targetTime }` | Request playback state update |
| `state_changed` | Server $\rightarrow$ Room | `{ playback, triggeredBy, action }` | Broadcast new synchronized video state |
| `assign_role` | Client $\rightarrow$ Server | `{ targetUserId, newRole }` | Host/Mod updates user role |
| `role_assigned` | Server $\rightarrow$ Room | `{ targetUserId, newRole, roomState }` | Broadcast updated participant role |
| `transfer_host` | Client $\rightarrow$ Server | `{ newHostUserId }` | Transfer host ownership |
| `remove_participant`| Client $\rightarrow$ Server | `{ targetUserId }` | Kick user from room |
| `submit_request` | Client $\rightarrow$ Server | `{ actionType, payload }` | Participant requests host approval |
| `resolve_request` | Client $\rightarrow$ Server | `{ requestId, status: 'approved'\|'rejected' }` | Host approves/rejects request |
| `send_chat` | Client $\rightarrow$ Server | `{ text }` | Send chat message |
| `send_reaction` | Client $\rightarrow$ Server | `{ emoji }` | Trigger floating emoji reaction |

---

## 🚀 Local Setup & Run Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Development Mode
Run the backend server (runs on `http://localhost:5000`):
```bash
cd server
npm run dev
```

In a second terminal window, run the frontend client (runs on `http://localhost:5173`):
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Production Build & Deployment

### Build Command
```bash
# Build client static assets and verify server compilation
npm run build
```

### Run Server with Built Client Assets
```bash
cd server
npm start
```
The Express server automatically serves the built Vite single-page web app from `client/dist` on port `5000`.

### Deployment Checklist (e.g. Render / Railway / Vercel)
1. Set Environment Variable: `PORT=5000`
2. Build Command: `npm run install:all && npm run build`
3. Start Command: `npm run start`

---

## 📈 Scalability Design (1,000+ Users & 100+ Rooms)

To scale the system horizontally beyond a single server instance to support 1,000+ concurrent users:
1. **Socket.IO Redis Adapter (`@socket.io/redis-adapter`)**: Replace single-node Socket.IO broadcaster with Redis Pub/Sub so events emitted on one backend server instance are routed to clients connected to other server instances.
2. **PostgreSQL / MongoDB Database**: Replace SQLite with a pooled PostgreSQL or MongoDB instance for cluster-wide room and user state persistence.
3. **Load Balancer (NGINX / HAProxy)**: Enable sticky sessions (`ip_hash`) for WebSocket handshake upgrades.

---

## 📝 License
MIT License.
