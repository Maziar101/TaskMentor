import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  FiBarChart2,
  FiFile,
  FiHeadphones,
  FiImage,
  FiLink,
  FiPlus,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { apiRequest } from "../../../services/api";
import { getLocale } from "../../../i18n/runtime";
import ChatAvatar from "./ChatAvatar";
import GroupMemberRow from "./group-info/GroupMemberRow";
import GroupMediaRow from "./group-info/GroupMediaRow";

const dialogPaperSx = {
  width: "min(556px, calc(100vw - 24px))",
  maxHeight: "min(860px, calc(100dvh - 24px))",
  m: 1.5,
  direction: "rtl",
  overflow: "hidden",
  border: "1px solid var(--tm-border-strong)",
  borderRadius: "8px",
  bgcolor: "var(--tm-page-base)",
  backgroundImage: "none",
  color: "var(--tm-text)",
  boxShadow: "0 30px 90px rgba(0, 0, 0, 0.68)",
};

const sectionSx = {
  overflow: "hidden",
  border: "1px solid var(--tm-border-soft)",
  borderRadius: "15px",
  bgcolor: "rgba(255, 255, 255, 0.015)",
};

const mediaDefinitions = [
  { key: "images", label: "عکس‌ها", Icon: FiImage },
  { key: "videos", label: "ویدیوها", Icon: FiVideo },
  { key: "audio", label: "فایل‌های صوتی", Icon: FiHeadphones },
  { key: "files", label: "فایل‌ها", Icon: FiFile },
  { key: "links", label: "لینک‌ها", Icon: FiLink },
  { key: "polls", label: "نظرسنجی‌ها", Icon: FiBarChart2 },
];

const videoExtensions = /\.(mp4|m4v|mov|webm|avi|mkv)$/i;
const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
const linkPattern = /https?:\/\/[^\s]+/gi;

function getMediaCounts(messages) {
  return messages.reduce(
    (counts, message) => {
      if (message.type === "file") {
        if (message.imageMime?.startsWith("image/")) counts.images += 1;
        else if (videoExtensions.test(message.fileName || ""))
          counts.videos += 1;
        else if (audioExtensions.test(message.fileName || ""))
          counts.audio += 1;
        else counts.files += 1;
      }
      if (message.type === "text") {
        counts.links += message.text?.match(linkPattern)?.length ?? 0;
      }
      if (message.type === "poll") counts.polls += 1;
      return counts;
    },
    { images: 0, videos: 0, audio: 0, files: 0, links: 0, polls: 0 },
  );
}

export default function GroupInfoDialog({
  open,
  conversation,
  messages,
  onClose,
}) {
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const mediaCounts = useMemo(() => getMediaCounts(messages), [messages]);

  const loadGroupInfo = useCallback(async () => {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    setLoading(true);
    setError("");
    try {
      const { group } = await apiRequest(
        `/api/chat/groups/${encodeURIComponent(conversation.id)}`,
      );
      if (requestSequence.current === requestId) setGroupInfo(group);
    } catch (requestError) {
      if (requestSequence.current === requestId) {
        setError(requestError.message || "دریافت اطلاعات گروه ناموفق بود");
      }
    } finally {
      if (requestSequence.current === requestId) setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    if (!open || !conversation.isGroup) return undefined;
    loadGroupInfo();
    return () => {
      requestSequence.current += 1;
    };
  }, [conversation.isGroup, loadGroupInfo, open]);

  const group = groupInfo?.id === conversation.id ? groupInfo : conversation;
  const memberCount = group.memberCount ?? conversation.memberCount ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="group-info-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { bgcolor: "rgba(0, 0, 0, 0.78)", backdropFilter: "blur(5px)" },
        },
      }}
    >
      <DialogContent
        sx={{
          p: { xs: 1.5, sm: "30px 10px" },
          width: "100%",
          direction: "ltr",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: "999px",
            bgcolor: "rgba(255,255,255,0.45)",
          },
          "& > *": { direction: "rtl" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: 100,
            display: "grid",
            placeItems: "center",
          }}
        >
          <IconButton
            type="button"
            aria-label="بستن اطلاعات گروه"
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              color: "var(--tm-text)",
              fontSize: 27,
              "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
            }}
          >
            <FiX />
          </IconButton>
          <Stack
            sx={{
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                "& .messenger-avatar": { width: 68, height: 68, fontSize: 22 },
              }}
            >
              <ChatAvatar conversation={group} size="large" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                id="group-info-title"
                component="h2"
                sx={{ m: 0, fontSize: 18, fontWeight: 850 }}
              >
                {group.name}
              </Typography>
              <Typography
                sx={{ mt: 0.3, color: "var(--tm-text-muted)", fontSize: 13 }}
              >
                {memberCount.toLocaleString(getLocale())} عضو
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          component="section"
          aria-labelledby="group-media-title"
          sx={{ ...sectionSx, mt: 1 }}
        >
          <Typography
            id="group-media-title"
            component="h3"
            sx={{ m: 0, px: 2, py: 1.55, fontSize: 18, fontWeight: 850 }}
          >
            رسانه‌های گروه
          </Typography>
          {mediaDefinitions.map(({ key, label, Icon }) => (
            <GroupMediaRow
              key={key}
              Icon={Icon}
              label={label}
              count={mediaCounts[key]}
            />
          ))}
        </Box>

        <Box
          component="section"
          aria-labelledby="group-members-title"
          sx={{ ...sectionSx, mt: 2 }}
        >
          <Stack
            sx={{
              px: 2,
              py: 1.5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              id="group-members-title"
              component="h3"
              sx={{ m: 0, fontSize: 18, fontWeight: 850 }}
            >
              اعضای گروه
            </Typography>
            <Typography sx={{ color: "var(--tm-text-muted)", fontSize: 13 }}>
              {memberCount.toLocaleString(getLocale())} عضو
            </Typography>
          </Stack>

          {group.isOwner && (
            <Stack
              sx={{
                minHeight: 62,
                px: 1.5,
                flexDirection: "row",
                alignItems: "center",
                gap: 1.5,
                borderTop: "1px solid var(--tm-border-soft)",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.065)",
                  fontSize: 25,
                }}
              >
                <FiPlus aria-hidden />
              </Box>
              <Typography sx={{ fontSize: 14.5, fontWeight: 750 }}>
                افزودن عضو
              </Typography>
            </Stack>
          )}

          {loading && (
            <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} sx={{ color: "var(--tm-accent)" }} />
            </Box>
          )}
          {!loading && error && (
            <Stack sx={{ p: 2, gap: 1.5 }}>
              <Alert
                severity="error"
                sx={{
                  bgcolor: "rgba(211,47,47,0.08)",
                  color: "var(--tm-text)",
                }}
              >
                {error}
              </Alert>
              <Button
                type="button"
                variant="outlined"
                onClick={loadGroupInfo}
                sx={{
                  alignSelf: "center",
                  borderColor: "var(--tm-border-strong)",
                  color: "var(--tm-text)",
                }}
              >
                تلاش دوباره
              </Button>
            </Stack>
          )}
          {!loading &&
            !error &&
            group.members?.map((member) => (
              <GroupMemberRow key={member.id} member={member} />
            ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
