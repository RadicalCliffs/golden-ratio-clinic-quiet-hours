import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#F6F1E8",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontSize: 18,
          color: "#A85C6B",
          letterSpacing: "0.04em",
        }}
      >
        ⁂
      </div>
    ),
    { ...size }
  );
}
