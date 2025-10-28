import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { io } from "socket.io-client";
import { supabase } from "../supabaseClient";

const socket = io("http://localhost:5000");

export default function DocumentEditor() {
  const { workspaceId, docId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentExists, setDocumentExists] = useState(false);

  const ydoc = new Y.Doc();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    content: "<p>Loading document...</p>",
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first!");
        navigate("/login");
        return;
      }

      setUser(user);

      // ✅ Load existing document
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", docId)
        .maybeSingle();

      if (error) {
        console.error("Error loading document:", error.message);
        alert("Error loading document");
        setLoading(false);
        return;
      }

      // ✅ If document exists, load content
      if (data) {
        setDocumentExists(true);
        if (data.content && editor) {
          editor.commands.setContent(data.content);
        }
      } else {
        // ✅ Create new document if not found
        const { error: createError } = await supabase.from("documents").insert([
          {
            id: docId,
            workspace_id: workspaceId,
            title: "Untitled Document",
            content: "<p>Start typing your document...</p>",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (createError) {
          console.error("Error creating document:", createError.message);
        } else {
          setDocumentExists(true);
        }
      }

      setLoading(false);
    };

    init();

    // ✅ Collaborative socket connection
    socket.emit("join-room", docId);

    socket.on("doc-update", (data) => {
      if (editor && data && data !== editor.getHTML()) {
        editor.commands.setContent(data);
      }
    });

    return () => {
      ydoc.destroy();
      socket.off("doc-update");
    };
  }, [docId, workspaceId, editor, ydoc, navigate]);

  // ✅ Save document to Supabase (with user check)
  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      navigate("/login");
      return;
    }

    if (!editor) return;

    const { error } = await supabase
      .from("documents")
      .update({
        content: editor.getHTML(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId);

    if (error) {
      console.error(error);
      alert("Error saving document");
    } else {
      socket.emit("doc-update", editor.getHTML(), docId);
      alert("Document saved successfully!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading document...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Document Editor</h1>
      <div className="border p-4 bg-white w-full max-w-3xl rounded shadow mb-4 min-h-[60vh]">
        <EditorContent editor={editor} />
      </div>

      <button
        onClick={handleSave}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Save Document
      </button>
    </div>
  );
}
