import { Box, Stack, Typography } from "@mui/material";
import ChatAvatar from "../ChatAvatar";

export default function GroupMemberRow({ member }) {
  const avatarConversation = {
    name: member.name,
    avatar: member.name?.trim().slice(0, 1) || "؟",
    avatarUrl: member.avatarUrl,
    online: member.isCurrentUser,
  };

  return (
    <Stack
      sx={{
        minHeight: 74,
        px: 1.5,
        flexDirection: "row",
        alignItems: "center",
        gap: 1.5,
        borderTop: "1px solid var(--tm-border-soft)",
      }}
    >
      <Box
        sx={{ flexShrink: 0, "& .messenger-avatar": { width: 50, height: 50 } }}
      >
        <ChatAvatar conversation={avatarConversation} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            overflow: "hidden",
            fontSize: 15,
            fontWeight: 750,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {member.name}
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            color: member.isCurrentUser ? "#00c975" : "var(--tm-text-muted)",
            fontSize: 12.5,
          }}
        >
          {member.isCurrentUser ? "آنلاین" : "عضو گروه"}
        </Typography>
      </Box>
      {member.isOwner && (
        <Box
          component="span"
          sx={{
            flexShrink: 0,
            px: 1.25,
            py: 0.45,
            border: "1px solid var(--tm-accent)",
            borderRadius: "9px",
            color: "var(--tm-accent)",
            fontSize: 11.5,
            fontWeight: 750,
          }}
        >
          مدیر
        </Box>
      )}
    </Stack>
  );
}
