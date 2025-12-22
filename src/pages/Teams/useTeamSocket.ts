import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

type TeamSocketHandlers = {
  onMessageCreated?: (payload: { groupId: string; message: unknown }) => void;
  onMessageUpdated?: (payload: { groupId: string; message: unknown }) => void;
  onMessageDeleted?: (payload: { groupId: string; messageId: string }) => void;
  onMemberStatus?: (payload: { memberId: string; status: "online" | "offline" }) => void;
  onTyping?: (payload: { groupId: string; memberId: string; isTyping: boolean }) => void;
};

type TeamSocketParams = {
  userId?: string;
  teamId?: string | null;
  groupId?: string | null;
  handlers: TeamSocketHandlers;
};

export default function useTeamSocket({ userId, teamId, groupId, handlers }: TeamSocketParams) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!socketRef.current) {
      const baseUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      socketRef.current = io(baseUrl, {
        path: "/socket.io",
        transports: ["websocket"],
      });
    }
    const socket = socketRef.current;
    socket.on("group.message.created", (payload) => handlers.onMessageCreated?.(payload));
    socket.on("group.message.updated", (payload) => handlers.onMessageUpdated?.(payload));
    socket.on("group.message.deleted", (payload) => handlers.onMessageDeleted?.(payload));
    socket.on("member.status.changed", (payload) => handlers.onMemberStatus?.(payload));
    socket.on("group.typing", (payload) => handlers.onTyping?.(payload));

    return () => {
      socket.off("group.message.created");
      socket.off("group.message.updated");
      socket.off("group.message.deleted");
      socket.off("member.status.changed");
      socket.off("group.typing");
    };
  }, [handlers, userId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !teamId || !userId) return;
    socket.emit("team.join", { teamId, userId });
  }, [teamId, userId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !groupId) return;
    socket.emit("group.join", { groupId });
    return () => {
      socket.emit("group.leave", { groupId });
    };
  }, [groupId]);

  const emitTyping = (payload: { groupId: string; memberId: string; isTyping: boolean }) => {
    socketRef.current?.emit("group.typing", payload);
  };

  return { socket: socketRef.current, emitTyping };
}
