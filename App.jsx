import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Workspace from "./pages/Workspace";
import Chat from "./pages/Chat";
import DocumentEditor from "./pages/DocumentEditor";
import VideoCall from "./pages/VideoCall";
import Navbar from "./pages/Navbar";
import Whiteboard from "./pages/Whiteboard";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Pages */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Workspace Dashboard */}
        <Route path="/workspace" element={<Workspace />} />

        {/* Chat */}
        <Route path="/chat/:workspaceId" element={<Chat />} />

        {/* Document Editor */}
        <Route path="/document/:workspaceId" element={<DocumentEditor />} />

        {/* Video Call */}
        <Route path="/video/:workspaceId" element={<VideoCall />} />

        {/* Optional Navbar route */}
        <Route path="/navbar" element={<Navbar />} />

        <Route path="/workspace/:workspaceId/whiteboard" element={<Whiteboard />} />

        <Route path="/profile" element={<Profile />} />


        {/* Catch-all */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-screen">
              <p className="text-xl">Page not found. Go to /signup or /login</p>
            </div>
          }
        />
      </Routes>

    </BrowserRouter>
  );
}
