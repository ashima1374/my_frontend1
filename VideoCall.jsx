import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

// ✅ Connect to backend socket
const socket = io("http://localhost:5000");

export default function VideoCall() {
  const { workspaceId } = useParams();
  const [stream, setStream] = useState(null);
  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);

  // ✅ 1️⃣ Create local stream ONCE when component mounts
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => console.error("Camera error:", err));
  }, []);

  // ✅ 2️⃣ Setup socket + signaling logic (only after stream is ready)
  useEffect(() => {
    if (!stream) return; // wait for camera
    socket.emit("join-room", workspaceId);

    // When another user joins and sends signal
    socket.on("user-joined", (signal) => {
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("return-signal", { signal, room: workspaceId });
      });

      peer.on("stream", (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peer.signal(signal);
      peerRef.current = peer;
    });

    // When receiving the returned signal
    socket.on("receiving-returned-signal", (signal) => {
      if (peerRef.current) peerRef.current.signal(signal);
    });

    // Cleanup on unmount
    return () => {
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [stream, workspaceId]);

  // ✅ 3️⃣ Start call (initiator)
  const callUser = () => {
    if (!stream) return;
    if (peerRef.current) return; // prevent multiple peers

    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("send-signal", { signal, room: workspaceId });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    socket.once("receiving-signal", (signal) => {
      peer.signal(signal);
    });

    peerRef.current = peer;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Workspace Video Call</h1>

      {/* ✅ Video Section */}
      <div className="flex flex-wrap justify-center gap-6">
        <video
          ref={myVideo}
          autoPlay
          playsInline
          muted
          className="w-[480px] h-[360px] rounded-xl border shadow-md object-cover bg-black"
        />
        <video
          ref={userVideo}
          autoPlay
          playsInline
          className="w-[480px] h-[360px] rounded-xl border shadow-md object-cover bg-black"
        />
      </div>

      {/* ✅ Button */}
      <button
        onClick={callUser}
        className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all"
      >
        Start Call
      </button>
    </div>
  );
}
