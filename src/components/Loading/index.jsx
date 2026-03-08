import { Stack, Typography } from "@mui/material";
import React from "react";
import { createPortal } from "react-dom";
import { MutatingDots } from "react-loader-spinner";

export default function Loading() {
  const overlay = (
    <Stack
      sx={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        background:
          "radial-gradient(circle at 20% 20%, rgba(90,141,255,0.14), transparent 35%), radial-gradient(circle at 80% 10%, rgba(255,199,89,0.2), transparent 40%), rgba(6,12,30,0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 13000,
        display: "grid",
        placeItems: "center",
        padding: 2,
      }}
    >
      <Stack
        sx={{
          alignItems: "center",
          gap: 2,
          p: 3,
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(12,23,50,0.65)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
          minWidth: { xs: "220px", sm: "260px" },
        }}
      >
        <MutatingDots
          color="#f5d364"
          secondaryColor="#60A5FA"
          height={110}
          width={110}
          ariaLabel="loading"
        />
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.2px",
          }}
        >
          در حال بارگذاری...
        </Typography>
      </Stack>
    </Stack>
  );

  return typeof document !== "undefined"
    ? createPortal(overlay, document.body)
    : overlay;
}
