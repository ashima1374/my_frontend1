import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function usePresence(workspaceId, user) {
  useEffect(() => {
    if (!workspaceId || !user) return;

    const updatePresence = async () => {
      await supabase.from("presence").upsert(
        {
          user_id: user.id,
          workspace_id: workspaceId,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id, workspace_id" }
      );
    };

    updatePresence();
    const interval = setInterval(updatePresence, 20000);

    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence" },
        (payload) => {
          console.log("Presence update:", payload);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user]);
}
