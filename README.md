# MeetNext - Video Conferencing Application

A real-time video conferencing application built with Next.js and WebRTC, providing secure and reliable peer-to-peer communication.

## Features

- 🎥 High-quality video and audio calls
- 💬 Real-time chat functionality
- 👥 Multiple participant support
- 🔒 Secure peer-to-peer connections
- 🎯 Low latency communication
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express, WebSocket
- **Real-time Communication**: WebRTC
- **Signaling**: Custom WebSocket server

## Project Structure

```
├── app/                # Next.js front-end application
│   ├── components/     # Reusable UI components
│   ├── room/           # Room-related pages
│   └── ...
├── server/             # Backend signaling server
│   └── server.js       # WebSocket signaling implementation
├── public/             # Static assets
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/meetnext.git
   cd meetnext
   ```

2. Install dependencies for the frontend
   ```bash
   npm install
   ```

3. Install dependencies for the backend
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Application

1. Start the signaling server
   ```bash
   cd server
   npm run dev
   ```

2. In a new terminal, start the Next.js application
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000` in your browser

## How It Works

### WebRTC Connection Flow

1. User creates or joins a room
2. Signaling server facilitates the exchange of connection information
3. Peers establish direct connections through WebRTC
4. Media streams are shared directly between peers

### Signaling Server

The signaling server handles:
- Room management
- User tracking
- Relaying connection information between peers
- Chat message delivery

## Security Considerations

- All WebRTC connections are encrypted using DTLS
- The signaling server only relays messages and doesn't have access to the media content
- STUN/TURN servers are used to establish connections through firewalls and NATs

## Deployment

### Frontend

The Next.js application can be deployed to Vercel:

```bash
npm run build
npm run start
```

### Backend

The signaling server can be deployed to any Node.js hosting service:

```bash
cd server
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. #   M e e t N e x t  
 