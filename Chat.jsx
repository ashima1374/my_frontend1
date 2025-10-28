import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

// ✅ Connect to your backend socket server
const socket = io("http://localhost:5000"); // change URL if deployed

export default function Chat() {
  const { workspaceId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState(null);

  // 🧠 Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("User fetch error:", error);
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  // 💬 Fetch messages & set up realtime
  useEffect(() => {
    if (!workspaceId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (!error && data) setMessages(data);
    };

    fetchMessages();

    // ✅ Join Socket.io room
    socket.emit("join-room", workspaceId);

    // 🔔 Listen for new messages via socket
    socket.on("new-message", (msg) => {
      if (msg.workspace_id === workspaceId) {
        setMessages((prev) => [...prev, msg]);
        if (msg.sender !== user?.id) {
          toast.success(`💬 New message from ${msg.senderName || "someone"}`);
        }
      }
    });

    // ✅ Supabase realtime fallback
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.workspace_id === workspaceId) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      socket.off("new-message");
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user]);

  // ✉️ Send message
  const sendMessage = async () => {
    if (!content.trim() || !user) return;

    const messageData = {
      content,
      sender: user.id, // UUID of current user
      senderName: user.email.split("@")[0],
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
    };

    // Save to Supabase
    const { error } = await supabase.from("messages").insert([messageData]);
    if (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
      return;
    }

    // Emit to other users
    socket.emit("new-message", messageData);

    // Clear input
    setContent("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <h1 className="text-2xl font-semibold text-center p-4">
        Workspace Chat 💬
      </h1>

      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id || msg.created_at}
              className={`p-2 rounded shadow-sm max-w-[70%] ${
                msg.sender === user?.id
                  ? "bg-blue-600 text-white self-end ml-auto"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm opacity-80 mb-1 font-semibold">
                {msg.senderName || "User"}
              </p>
              <p>{msg.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center mt-4">No messages yet.</p>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 flex gap-2 bg-white border-t">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
