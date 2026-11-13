# GuardianLink 🛡️📱

> **Next-Generation Real-Time Parental Safety, Telemetry, and Silent Emergency Response Ecosystem**

GuardianLink is a full-stack, enterprise-grade parental control and child protection application engineered with **React Native (Expo SDK 58)**, **Node.js/Express**, **MongoDB**, and **Socket.IO**. Designed with both security and discretion in mind, GuardianLink pairs a feature-rich parental surveillance dashboard with a **stealth calculator child client** that operates unobtrusively in everyday life while providing real-time telemetry, automated overspeed warnings, contact synchronization, and silent emergency SOS triggers.

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [System Architecture](#-system-architecture)
- [Features Deep Dive](#-features-deep-dive)
  - [1. Stealth Calculator Interface (Child App)](#1-stealth-calculator-interface-child-app)
  - [2. Silent Emergency SOS & Push Notifications](#2-silent-emergency-sos--push-notifications)
  - [3. Real-Time GPS Tracking & Live Map](#3-real-time-gps-tracking--live-map)
  - [4. Automated Speeding Detection](#4-automated-speeding-detection)
  - [5. Remote Contact Book Sync](#5-remote-contact-book-sync)
  - [6. Multi-Child Parental Dashboard](#6-multi-child-parental-dashboard)
  - [7. Profile & Credential Management](#7-profile--credential-management)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Local Setup](#-installation--local-setup)
  - [Backend Setup](#backend-setup)
  - [Mobile App Setup](#mobile-app-setup)
  - [One-Click Startup Script](#one-click-startup-script-windows)
- [Child App Stealth Codes Guide](#-child-app-stealth-codes-guide)
- [REST API Documentation](#-rest-api-documentation)
- [Real-Time WebSocket Events](#-real-time-websocket-events-socketio)
- [Building & Deployment](#-building--deployment-android-apk)
- [Security & Privacy Architecture](#-security--privacy-architecture)
- [License](#-license)

---

## 🌟 Key Highlights

- **Stealth Camouflage Mode**: The child interface looks and functions identically to a standard digital calculator, completely hiding its monitoring and SOS capabilities from casual observation or peer pressure.
- **Silent Duress SOS Trigger**: Children can dial secret sequences (`911=`) into the calculator to immediately notify parents without sounding audible alarms on the child device.
- **1-Second High-Precision Telemetry**: Continuous location sampling using Expo Location's `BestForNavigation` accuracy with real-time updates pushed across WebSockets.
- **Sub-Second Map Visualizations**: Interactive Leaflet map running in React Native WebView featuring live markers, speed readouts, and direct links to Google Maps navigation.
- **Overspeed Protection Engine**: Instant push notification dispatched to parents whenever travel speed exceeds 60 km/h (16.67 m/s).
- **Background Contact Synchronization**: Automatic background synchronization of child contacts so parents have immediate access to their child's social circle in an emergency.
- **Hardened Mobile Security**: Session tokens persisted via encrypted hardware keystores using `expo-secure-store`.

---

## 🏗️ System Architecture

```
                  ┌──────────────────────────────────────────────────┐
                  │                 CHILD DEVICE                     │
                  │  ┌────────────────────────────────────────────┐  │
                  │  │        Stealth Calculator Interface        │  │
                  │  │  - Standard Arithmetic                     │  │
                  │  │  - Hidden SOS Trigger (911=)               │  │
                  │  │  - Quick Lock / Logout (0000 / CCC)        │  │
                  │  └──────────────────────┬─────────────────────┘  │
                  │                         │                        │
                  │     Expo Location       │     Expo Contacts      │
                  │   (1s GPS Telemetry)    │    (Auto-Sync Sync)    │
                  └─────────────┬───────────┴───────────┬────────────┘
                                │                       │
                   WebSocket    │                       │ HTTP POST
                   (Port 5000)  │                       │ Bearer Token
                                ▼                       ▼
                  ┌──────────────────────────────────────────────────┐
                  │              GUARDIANLINK BACKEND                │
                  │             (Node.js / Express.js)               │
                  │                                                  │
                  │  ┌─────────────────────┐  ┌───────────────────┐  │
                  │  │ Socket.IO Server    │  │ REST API Endpoints│  │
                  │  │ (child_ room relays)│  │ (/api/auth, /loc) │  │
                  │  └──────────┬──────────┘  └─────────┬─────────┘  │
                  │             │                       │            │
                  │             ▼                       ▼            │
                  │  ┌─────────────────────┐  ┌───────────────────┐  │
                  │  │   MongoDB Database  │  │ Expo Push Service │  │
                  │  │ (Users, Geo, Roster)│  │ (Emergency/Speed) │  │
                  │  └─────────────────────┘  └─────────┬─────────┘  │
                  └─────────────────────────────────────┼────────────┘
                                                        │
                                   Push Notifications   │ Socket.IO Live Telemetry
                                   & REST Queries       │
                                                        ▼
                  ┌──────────────────────────────────────────────────┐
                  │                 PARENT DEVICE                    │
                  │  ┌────────────────────────────────────────────┐  │
                  │  │             Parent Dashboard               │  │
                  │  │  - Real-Time Live Map (WebView Leaflet)    │  │
                  │  │  - Speed Gauges & Google Maps Direction    │  │
                  │  │  - Emergency SOS Push Banner & Alert Audio │  │
                  │  │  - Contact Roster & Search                 │  │
                  │  │  - Add / Link Multiple Children            │  │
                  │  └────────────────────────────────────────────┘  │
                  └──────────────────────────────────────────────────┘
```

---

## 🚀 Features Deep Dive

### 1. Stealth Calculator Interface (Child App)
When logged in with a `child` account, the user is presented with a standard digital calculator supporting addition, subtraction, multiplication, and division. To external viewers, the device is merely running an ordinary calculator utility.

### 2. Silent Emergency SOS & Push Notifications
In situations where a child is in distress, dialing `911` followed by `=` into the calculator:
1. Immediately dispatches an authenticated HTTP POST to `/api/emergency`.
2. The server locates all parents linked to this child.
3. Broadcasts high-priority push notifications using the **Expo Push Notification Service**:
   > 🚨 **EMERGENCY ALERT** 🚨
   > `[Child Name]` has pressed the Emergency Button! Check their location immediately.
4. Changes the calculator display to a subtle `Error 911` so bystander attention is never drawn to the distress broadcast.

### 3. Real-Time GPS Tracking & Live Map
- Samples GPS coordinates every **1,000 milliseconds** using `Location.Accuracy.BestForNavigation`.
- Emits real-time coordinates, bearing speed, and timestamps over Socket.IO room channels (`child_<childId>`).
- Parents view the live coordinates directly in an integrated Leaflet WebView with auto-panning markers and one-touch "Open in Google Maps" external navigation.

### 4. Automated Speeding Detection
- Location packets received with speed $> 16.67\text{ m/s}$ (approx. **60 km/h**) trigger an automated warning engine.
- Sends an instantaneous push notification alert to parent devices:
   > ⚠️ **Speeding Alert** ⚠️
   > `[Child Name]` is travelling at over 60 km/h!

### 5. Remote Contact Book Sync
- On child app startup, permissions are requested to read the address book via `expo-contacts`.
- Contact records are securely upserted into the MongoDB datastore.
- Parents can browse, search, and monitor phone numbers stored on their child's phone remotely through the **Contacts** tab.

### 6. Multi-Child Parental Dashboard
- Parents can link one or more child accounts using the child's registered email address.
- Easily toggle between monitored children, inspect historical telemetry, and manage guardian pairings.

### 7. Profile & Credential Management
- Avatar uploading supported via `multer` storing image assets in `/uploads`.
- Expo push tokens auto-registered on login for native device alert routing.
- Fast, secure sign-out and session hydration powered by `expo-secure-store`.

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native 0.88.1 / Expo SDK 58
- **Routing**: Expo Router (File-based navigation)
- **State & Storage**: React Context API, Expo Secure Store
- **Networking**: Axios, Socket.IO Client v4
- **Sensors & Permissions**: Expo Location, Expo Contacts, Expo Notifications, Expo Image Picker
- **Maps**: React Native WebView rendering responsive OpenStreetMap via Leaflet
- **UI & Layout**: React Native Safe Area Context, Vector Icons

### Backend (Server)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.IO v4 (CORS-enabled with room-based broadcast)
- **Authentication**: JSON Web Tokens (JWT) & Bcrypt (10 rounds)
- **File Uploads**: Multer
- **Push Services**: Expo Server SDK (`expo-server-sdk`)

---

## 📂 Project Structure

```
guardianlink/
├── android/                     # Generated Android native project & Gradle build
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
├── app/                         # Expo Router application structure
│   ├── (auth)/                  # Authentication route group
│   │   ├── _layout.jsx
│   │   ├── login.jsx            # Parent & Child login screen
│   │   └── register.jsx         # Account registration screen
│   ├── (child)/                 # Child route group
│   │   ├── _layout.jsx
│   │   └── index.jsx            # Stealth Calculator & tracking service
│   ├── (tabs)/                  # Parent navigation tabs
│   │   ├── _layout.jsx          # Tab bar & notification handler config
│   │   ├── dashboard.jsx        # Child pairing & child list
│   │   ├── location.jsx         # Live interactive map & telemetry gauge
│   │   ├── contacts.jsx         # Child phonebook search & view
│   │   └── profile.jsx          # Parent profile & avatar management
│   └── _layout.jsx              # Root layout with AuthProvider & Navigation Stack
├── assets/                      # Icons, splash images, adaptive assets
├── context/
│   └── AuthContext.jsx          # Secure session management & role routing
├── services/
│   └── api.js                   # Axios client with JWT interceptor
├── server/                      # Node.js backend
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   └── upload.js            # Multer disk storage for avatars
│   ├── models/
│   │   ├── Child.js             # Parent-Child relationship schema
│   │   ├── Contact.js           # Synced phonebook schema
│   │   ├── Location.js          # Telemetry and speed logs schema
│   │   └── User.js              # Account credentials & push tokens schema
│   ├── routes/
│   │   ├── auth.js              # Login and Register endpoints
│   │   ├── children.js          # Child pairing endpoints
│   │   ├── contacts.js          # Contact synchronization endpoints
│   │   ├── emergency.js         # SOS panic handler & push dispatcher
│   │   ├── location.js          # Location history & speed monitoring
│   │   └── users.js             # User profiles & push tokens
│   ├── utils/
│   │   └── push.js              # Expo Push Notification client
│   ├── package.json             # Server dependencies
│   ├── server.js                # Express & Socket.IO server entrypoint
│   └── .env.example             # Environment template
├── app.json                     # Expo configuration manifest
├── eas.json                     # Expo Application Services build configuration
├── package.json                 # Client dependencies & scripts
├── start-all.bat                # Windows dual-service launcher script
└── README.md                    # Project documentation
```

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **yarn**
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI
- **Expo Go App** (available on iOS App Store / Google Play) OR an Android Emulator / physical device connected via USB with Developer Mode & USB Debugging enabled

---

## ⚙️ Installation & Local Setup

### Backend Setup

1. Open your terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   Configure the variables inside `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/guardianlink
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. Start the backend in development mode (with hot reloading):
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000` with WebSocket connections accepted on port 5000.*

---

### Mobile App Setup

1. From the project root directory, install mobile dependencies:
   ```bash
   npm install
   ```

2. **Configure your Local IP Address**:
   Because mobile devices and emulators connect over the local network, replace the local IP `192.168.1.165` with your machine's actual LAN IP:
   - Check your machine's IP (`ipconfig` on Windows or `ifconfig` on macOS/Linux).
   - Update `services/api.js`:
     ```javascript
     const API_URL = "http://<YOUR_LOCAL_IP>:5000/api";
     ```
   - Update `app/(child)/index.jsx`:
     ```javascript
     const SOCKET_URL = "http://<YOUR_LOCAL_IP>:5000";
     ```
   - Update `app/(tabs)/location.jsx`:
     ```javascript
     const SOCKET_URL = "http://<YOUR_LOCAL_IP>:5000";
     ```

3. Start the Expo development server:
   ```bash
   npx expo start -c
   ```
   - Scan the QR code using the **Expo Go** application on your physical Android or iOS device.
   - Or press `a` in the terminal to launch on a running Android emulator.

---

### One-Click Startup Script (Windows)

For convenience on Windows, run the included `start-all.bat` script from the project root:
```bat
start-all.bat
```
This automatically launches the backend server with `nodemon` in one command prompt and the Expo bundler in a second window.

---

## 🔢 Child App Stealth Codes Guide

When logged in on the child's phone, the app presents a functioning calculator. Keep these secret keys in mind:

| Key Sequence | Action | Visible Result on Screen |
| :--- | :--- | :--- |
| `[Any valid math] =` | Evaluates arithmetic expression | Shows math result (e.g., `42`) |
| `911=` or typing `911` | **Emergency SOS Alert** | Triggers silent distress push notification to parents; displays `Error 911` |
| `0000` or `0000=` | **Quick Exit / Sign Out** | Logs out child session and opens Login screen |
| `C` `C` `C` (Triple C) | **Instant Unlock / Sign Out** | Clears credentials from keystore and exits to Login screen |

---

## 📡 REST API Documentation

### Base URL: `/api`

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/auth/register` | ❌ | Create user account | `{ "name": "...", "email": "...", "password": "...", "role": "parent" \| "child" }` |
| `POST` | `/auth/login` | ❌ | Authenticate credentials & return JWT | `{ "email": "...", "password": "..." }` |

### 2. Children Management (`/api/children`)

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/children` | ✅ (Parent) | Fetch all child profiles linked to parent | None |
| `POST` | `/children` | ✅ (Parent) | Link child by child account email | `{ "childEmail": "child@domain.com" }` |

### 3. Location Telemetry (`/api/location`)

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/location` | ✅ (Child) | Upload location sample & check overspeed | `{ "latitude": 28.61, "longitude": 77.20, "speed": 12.5 }` |
| `GET` | `/location/:childId` | ✅ (Parent) | Fetch latest 50 location history records | None |

### 4. Contacts Synchronization (`/api/contacts`)

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/contacts/sync` | ✅ (Child) | Upsert device contacts to MongoDB | `{ "contacts": [{ "name": "Mom", "phoneNumbers": [...] }] }` |
| `GET` | `/contacts/:childId` | ✅ (Parent) | Retrieve all synced contacts for child | None |

### 5. Emergency SOS (`/api/emergency`)

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/emergency` | ✅ (Child) | Broadcast immediate SOS alert to linked parents | None |

### 6. User Profile & Tokens (`/api/users`)

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/users/profile` | ✅ | Fetch active authenticated profile | None |
| `PUT` | `/users/profile` | ✅ | Update profile name or avatar (`multipart`) | `FormData` (`name`, `profilePicture`) |
| `PUT` | `/users/push-token` | ✅ | Register or refresh Expo Push Token | `{ "token": "ExponentPushToken[...]" }` |

---

## 🔌 Real-Time WebSocket Events (Socket.IO)

GuardianLink utilizes Socket.IO for low-latency coordinates synchronization:

### Client -> Server

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-child` | Client ➔ Server | `childId` (string) | Subscribes socket to room `child_<childId>` |
| `child-location-update` | Client ➔ Server | `{ childId, latitude, longitude, speed }` | Broadcasts fresh coordinates from child |

### Server -> Client

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `location-update` | Server ➔ Client | `{ childId, latitude, longitude, speed, timestamp }` | Dispatched to parents listening on the map view |

---

## 📦 Building & Deployment (Android APK)

The repository comes pre-configured with Expo Prebuild and EAS Build configurations in `eas.json` and `android/`.

### Option A: Cloud Build using EAS (Recommended)

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Build a standalone Android APK:
   ```bash
   eas build -p android --profile preview
   ```

### Option B: Local Android Gradle Build

1. Ensure the Android SDK and `ANDROID_HOME` environment variables are configured.
2. Build release APK directly:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. Find your built APK at:
   `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔒 Security & Privacy Architecture

- **Encrypted Local Storage**: Authentication tokens are stored using device-level hardware keychains (`Expo SecureStore`), mitigating token leakage risks.
- **Stateless Authorization**: All sensitive APIs are guarded with JSON Web Token (JWT) verification middleware enforcing strict role boundaries (`parent` vs. `child`).
- **Targeted WebSocket Rooms**: Real-time position packets are routed to designated child-parent rooms (`child_<childId>`), ensuring isolation between family units.
- **Discreet Emergency Signaling**: Panic states avoid visual indicators on the child's screen, minimizing danger during coercive or hostile scenarios.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - feel free to use and adapt it for personal, research, or commercial safety projects.
