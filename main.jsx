import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind styles
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // ✅ your backend socket server URL

function Root() {
  useEffect(() => {
    // 🧠 Listen for new messages from socket server
    socket.on("new-message", (msg) => {
      toast.success(`💬 New message from ${msg.senderName}`);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <>
      <App />
      <Toaster position="top-right" />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);


