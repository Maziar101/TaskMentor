import { useEffect, useReducer, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FiPlus } from "react-icons/fi";
import { HandleReduce } from "../../../utils/HandleReducer";
import { getLocale } from "../../../i18n/runtime";
import { primaryButtonSx, textFieldSx } from "./NewChatActions.styles";
import GroupImageDropzone, {
  GROUP_IMAGE_MIME_TYPES,
} from "./NewChatActions/GroupImageDropzone";
const initialState = {
  step: 1,
  name: "",
  imageFile: null,
  imagePreview: "",
  selectedIds: [],
  search: "",
  error: "",
};
function reducer(state, action) {
  if (action.type === "reset") return initialState;
  return { ...state, [action.type]: action.payload };
}
export default function NewChatActions({ busy, contacts, onCreateGroup, onGroupCreated }) {
  const [anchorElement, setAnchorElement] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <button
        className="messenger-new-button"
        type="button"
        onClick={(event) => setAnchorElement(event.currentTarget)}
        aria-label="ایجاد گفتگوی جدید"
        title="ایجاد گفتگوی جدید"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
      >
        <FiPlus />
      </button>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 180,
              border: "1px solid var(--tm-accent-border)",
              borderRadius: "14px",
              bgcolor: "var(--tm-surface-elevated)",
              color: "var(--tm-text)",
              boxShadow: "0 18px 45px rgba(0, 0, 0, 0.46)",
              direction: "rtl",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorElement(null);
            setDialogOpen(true);
          }}
          sx={{ minHeight: 46, gap: 1.25, borderRadius: "10px", mx: 0.75, fontWeight: 800 }}
        >
          <GroupAddRoundedIcon sx={{ color: "var(--tm-accent)" }} />
          گروه جدید
        </MenuItem>
      </Menu>
      <CreateGroupDialog
        busy={busy}
        contacts={contacts}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={onCreateGroup}
        onCreated={onGroupCreated}
      />
    </>
  );
}

function CreateGroupDialog({ busy, contacts, open, onClose, onCreate, onCreated }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const handleReducer = HandleReduce(dispatch);
  const query = state.search.trim().toLocaleLowerCase(getLocale());
  const visibleContacts = contacts.filter((contact) => !query
    || contact.name.toLocaleLowerCase(getLocale()).includes(query)
    || contact.phone.includes(query));

  useEffect(() => () => {
    if (state.imagePreview) URL.revokeObjectURL(state.imagePreview);
  }, [state.imagePreview]);

  const closeDialog = () => {
    if (busy) return;
    dispatch({ type: "reset" });
    onClose();
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!GROUP_IMAGE_MIME_TYPES.includes(file.type)) {
      handleReducer("error", "فرمت تصویر باید JPEG، PNG، WebP یا GIF باشد.");
      return;
    }
    handleReducer(
      ["imageFile", "imagePreview", "error"],
      [file, URL.createObjectURL(file), ""],
    );
  };

  const toggleContact = (contactId) => {
    handleReducer("selectedIds", state.selectedIds.includes(contactId)
      ? state.selectedIds.filter((id) => id !== contactId)
      : [...state.selectedIds, contactId]);
  };

  const createGroup = async () => {
    if (!state.name.trim() || busy) return;
    handleReducer("error", "");
    const result = await onCreate({
      name: state.name.trim(),
      imageFile: state.imageFile,
      memberIds: state.selectedIds,
    });
    if (!result.success) {
      handleReducer("error", result.error);
      return;
    }
    dispatch({ type: "reset" });
    onClose();
    onCreated(result.conversation.id);
  };

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      aria-labelledby="create-group-title"
      sx={{
        position: "fixed",
        inset: 0,
        "& .MuiDialog-container": { p: 1.5, alignItems: "center" },
      }}
      slotProps={{
        backdrop: {
          sx: {
            position: "fixed",
            bgcolor: "rgba(4, 2, 12, 0.76)",
            backdropFilter: "blur(8px)",
          },
        },
        paper: {
          sx: {
            width: "calc(100% - 24px)",
            maxWidth: 520,
            maxHeight: "calc(100dvh - 36px)",
            m: 0,
            border: "1px solid var(--tm-accent-border)",
            borderRadius: "20px",
            background: "linear-gradient(145deg, var(--tm-surface-elevated), var(--tm-surface-deep))",
            boxShadow: "0 28px 75px rgba(0, 0, 0, 0.58)",
            color: "var(--tm-text)",
            direction: "rtl",
          },
        },
      }}
    >
      <DialogTitle
        id="create-group-title"
        sx={{ p: "20px 20px 8px", display: "flex", alignItems: "center", gap: 1 }}
      >
        {state.step === 2 && (
          <IconButton
            type="button"
            disabled={busy}
            onClick={() => handleReducer(["step", "error"], [1, ""])}
            aria-label="مرحله قبل"
            sx={{ color: "var(--tm-text-muted)", "&:hover": { bgcolor: "var(--tm-accent-tint)" } }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        )}
        <Stack sx={{ minWidth: 0, flex: 1, gap: 0.25 }}>
          <Typography component="span" sx={{ fontSize: "1rem", fontWeight: 900 }}>
            {state.step === 1 ? "ساخت گروه جدید" : "دعوت از مخاطبین"}
          </Typography>
          <Typography component="span" sx={{ color: "var(--tm-text-muted)", fontSize: "0.7rem" }}>
            مرحله {state.step.toLocaleString(getLocale())} از ۲
          </Typography>
        </Stack>
        <IconButton
          type="button"
          disabled={busy}
          onClick={closeDialog}
          aria-label="بستن"
          sx={{ color: "var(--tm-text-muted)", "&:hover": { bgcolor: "var(--tm-accent-tint)" } }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: "14px 20px 22px !important" }}>
        {state.step === 1 ? (
          <Stack sx={{ alignItems: "center", gap: 2.25 }}>
            <GroupImageDropzone
              imagePreview={state.imagePreview}
              onFileSelect={handleImageSelect}
            />
            <TextField
              autoFocus
              value={state.name}
              onChange={(event) => handleReducer("name", event.target.value)}
              placeholder="نام گروه"
              inputProps={{ maxLength: 120 }}
              sx={textFieldSx}
            />
            {state.error && <Alert severity="error" sx={{ width: "100%", borderRadius: "12px" }}>{state.error}</Alert>}
            <Button
              type="button"
              disabled={!state.name.trim()}
              onClick={() => handleReducer(["step", "error"], [2, ""])}
              sx={primaryButtonSx}
            >
              مرحله بعد
            </Button>
          </Stack>
        ) : (
          <Stack sx={{ gap: 1.5 }}>
            <TextField
              autoFocus
              value={state.search}
              onChange={(event) => handleReducer("search", event.target.value)}
              placeholder="جستجو در مخاطبین..."
              inputProps={{ "aria-label": "جستجو در مخاطبین" }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>,
              }}
              sx={textFieldSx}
            />
            <Typography sx={{ color: "var(--tm-text-muted)", fontSize: "0.76rem" }}>
              {state.selectedIds.length
                ? `${state.selectedIds.length.toLocaleString(getLocale())} مخاطب انتخاب شده`
                : "مخاطب‌های موردنظر را برای دعوت انتخاب کنید"}
            </Typography>
            <List
              aria-label="انتخاب اعضای گروه"
              sx={{ maxHeight: 280, overflowY: "auto", p: 0, border: "1px solid var(--messenger-line)", borderRadius: "14px" }}
            >
              {visibleContacts.length ? visibleContacts.map((contact) => (
                <ListItemButton
                  key={contact.id}
                  selected={state.selectedIds.includes(contact.id)}
                  onClick={() => toggleContact(contact.id)}
                  sx={{ gap: 1, borderBottom: "1px solid var(--messenger-line-soft)", "&:last-child": { borderBottom: 0 } }}
                >
                  <Avatar
                    src={contact.avatarUrl || undefined}
                    sx={{ width: 40, height: 40, bgcolor: "var(--tm-primary-soft)", color: "#fff" }}
                  >
                    {contact.avatar}
                  </Avatar>
                  <ListItemText
                    primary={contact.name}
                    secondary={contact.phone}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      m: 0,
                      textAlign: "start",
                      "& .MuiListItemText-primary": { fontWeight: 800 },
                      "& .MuiListItemText-secondary": {
                        color: "var(--tm-text-muted)",
                        direction: "ltr",
                        textAlign: "start",
                      },
                    }}
                  />
                  <Checkbox
                    checked={state.selectedIds.includes(contact.id)}
                    tabIndex={-1}
                    sx={{ color: "var(--tm-text-muted)", "&.Mui-checked": { color: "var(--tm-accent)" } }}
                  />
                </ListItemButton>
              )) : (
                <Typography sx={{ p: 3, color: "var(--tm-text-muted)", textAlign: "center", fontSize: "0.8rem" }}>
                  مخاطبی پیدا نشد.
                </Typography>
              )}
            </List>
            {state.error && <Alert severity="error" sx={{ borderRadius: "12px" }}>{state.error}</Alert>}
            <Button type="button" disabled={busy} onClick={createGroup} sx={primaryButtonSx}>
              {busy ? "در حال ساخت گروه…" : "ساخت گروه"}
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
