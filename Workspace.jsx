import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "./Chat";
import DocumentEditor from "./DocumentEditor";
import Whiteboard from "./Whiteboard";
import VideoCall from "./VideoCall";
import TaskBoard from "./TaskBoard";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

// ✅ Connect to backend socket server (for chat etc.)
const socket = io("http://localhost:5000");

export default function Workspace() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 🧠 Fetch user + workspaces
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first!");
        navigate("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("mytable")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching workspaces:", error);
      else setWorkspaces(data);
    };

    fetchData();
  }, [navigate]);

  // 🪄 Supabase Realtime Presence System (Clean + Fixed)
  useEffect(() => {
  if (!selectedWorkspace || !user) return;

  const upsertPresence = async () => {
    const { error } = await supabase
      .from("presence")
      .upsert(
        {
          user_id: user.id,
          workspace_id: selectedWorkspace.id,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id, workspace_id" }
      );
    if (error) console.error("❌ Presence upsert error:", error);
    else console.log("✅ Presence updated for:", user.id);
  };

  // 🕒 Initial insert + keep updating every 15s
  upsertPresence();
  const interval = setInterval(upsertPresence, 15000);

  // 🪄 Listen for realtime presence changes
  const channel = supabase
    .channel(`presence-${selectedWorkspace.id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "presence" },
      async () => {
        const { data, error } = await supabase
          .from("presence")
          .select("user_id, last_seen")
          .eq("workspace_id", selectedWorkspace.id);
        if (!error) {
          setOnlineUsers(data || []);
          console.log("📡 Presence updated:", data);
        }
      }
    )
    .subscribe();

  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}, [selectedWorkspace, user]);


  // 🧩 SOCKET.IO → Track online users (optional, for later)
  /*
  useEffect(() => {
    if (user) {
      socket.emit("user-online", user.id);
    }

    socket.on("update-online-users", (users) => {
      setOnlineUsers((prev) => [
        ...new Set([...prev.map((u) => u.user_id), ...users]),
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
  */

  // 🏗️ Create workspace
  const createWorkspace = async (e) => {
    e.preventDefault();

    if (!user) return alert("You must be logged in to create a workspace.");

    const { data: inserted, error } = await supabase
      .from("mytable")
      .insert([
        {
          name,
          description,
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (error) return alert(error.message);

    // Add creator as member
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert([{ workspace_id: inserted.id, user_id: user.id }]);

    if (memberError) {
      console.error("Error adding member:", memberError.message);
      alert("Workspace created but failed to add as member.");
    } else {
      alert("Workspace created successfully!");
    }

    setName("");
    setDescription("");
    window.location.reload();
  };

  // 🪄 Render tab components
  const renderActiveTab = () => {
    if (!selectedWorkspace) return null;
    switch (activeTab) {
      case "chat":
        return <Chat workspaceId={selectedWorkspace.id} />;
      case "tasks":
        return <TaskBoard workspaceId={selectedWorkspace.id} />;
      case "docs":
        return <DocumentEditor workspaceId={selectedWorkspace.id} />;
      case "whiteboard":
        return <Whiteboard workspaceId={selectedWorkspace.id} />;
      case "video":
        return <VideoCall workspaceId={selectedWorkspace.id} />;
      default:
        return <Chat workspaceId={selectedWorkspace.id} />;
    }
  };

  // 🧭 If workspace selected → Dashboard view
  if (selectedWorkspace) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* ✅ Top Navbar */}
        <div className="flex justify-between items-center bg-green-700 text-white px-6 py-3 shadow-md">
          <h1 className="text-xl font-semibold">🧠 {selectedWorkspace.name}</h1>

          <div className="flex space-x-3">
            {["chat", "tasks", "docs", "whiteboard", "video"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded capitalize transition hover:scale-105 duration-200 ${
                  activeTab === tab ? "bg-green-900" : "hover:bg-green-800"
                }`}
              >
                {tab}
              </button>
            ))}

            <button
              onClick={() => setSelectedWorkspace(null)}
              className="ml-3 bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition hover:scale-105 duration-200"
            >
              ← Exit
            </button>
          </div>
        </div>

        {/* ✅ Main content area */}
        <div className="grid grid-cols-4 gap-4 p-4">
          {/* 🧑‍💻 Left Panel — Online Users */}
          <div className="col-span-1 bg-white shadow-lg rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">
              👥 Online Users ({onlineUsers.length})
            </h2>
            <ul className="space-y-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((u, i) => (
                  <li
                    key={i}
                    className="bg-green-100 px-3 py-1 rounded text-green-800 text-sm font-medium"
                  >
                    {u.user_id?.slice(0, 6) || u}
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No one online yet</p>
              )}
            </ul>
          </div>

          {/* 📋 Main workspace content */}
          <div className="col-span-3 bg-white shadow-inner rounded-lg p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {renderActiveTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // 🏡 Default Workspace List + Creation
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
      <h1 className="text-3xl font-bold mb-6">My Workspaces</h1>

      {/* Create workspace form */}
      <form
        onSubmit={createWorkspace}
        className="mb-6 flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition hover:scale-105 duration-200"
        >
          Create
        </button>
      </form>

      {/* Workspace list */}
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {workspaces.length > 0 ? (
          workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => setSelectedWorkspace(ws)}
              className="border p-4 rounded-lg shadow-md bg-white flex flex-col gap-2 cursor-pointer 
                        transition hover:scale-105 hover:shadow-2xl duration-200"
            >
              <h2 className="font-semibold text-lg">{ws.name}</h2>
              <p className="text-gray-600">{ws.description}</p>
              {ws.created_at && (
                <p className="text-sm text-gray-400">
                  Created: {new Date(ws.created_at).toLocaleString()}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No workspaces yet. Create one above!</p>
        )}
      </div>
    </div>
  );
}
