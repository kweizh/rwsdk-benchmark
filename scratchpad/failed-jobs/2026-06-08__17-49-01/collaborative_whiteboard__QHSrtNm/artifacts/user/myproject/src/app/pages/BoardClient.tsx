"use client";

import { useRef, useEffect } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

interface Dot {
  x: number;
  y: number;
  color: string;
}

interface BoardClientProps {
  boardId: string;
}

export const BoardClient: React.FC<BoardClientProps> = ({ boardId }) => {
  const [dots, setDots] = useSyncedState<Dot[]>([], "dots", boardId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw dots whenever the dots list changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all dots
    const currentDots = Array.isArray(dots) ? dots : [];
    currentDots.forEach((dot) => {
      if (typeof dot.x === "number" && typeof dot.y === "number") {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = dot.color || "#ff0000";
        ctx.fill();
      }
    });
  }, [dots]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const color = "#ff0000"; // Deterministic CSS color string

    setDots((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      return [...current, { x, y, color }];
    });
  };

  const handleClear = () => {
    setDots([]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            color: "#1d1d1f",
            fontWeight: 600,
          }}
        >
          Collaborative Whiteboard
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#86868b" }}>
          Board ID: <strong style={{ color: "#0071e3" }}>{boardId}</strong>
        </p>

        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onClick={handleCanvasClick}
          style={{
            border: "1px solid #d2d2d7",
            borderRadius: "8px",
            cursor: "crosshair",
            backgroundColor: "#fafafa",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleClear}
            style={{
              padding: "10px 24px",
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffffff",
              backgroundColor: "#ff453a",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#ff3b30")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#ff453a")
            }
          >
            Clear Board
          </button>
        </div>
      </div>
    </div>
  );
};
