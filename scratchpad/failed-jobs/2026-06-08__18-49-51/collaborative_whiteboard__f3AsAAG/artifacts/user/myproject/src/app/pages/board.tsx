"use client";

import { useSyncedState } from "rwsdk/use-synced-state/client";

type Dot = { x: number; y: number; color: string };

// Deterministic color derived from boardId
function boardColor(boardId: string): string {
  let hash = 0;
  for (let i = 0; i < boardId.length; i++) {
    hash = (hash * 31 + boardId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function WhiteboardCanvas({ boardId }: { boardId: string }) {
  const color = boardColor(boardId);
  const [dots, setDots] = useSyncedState<Dot[]>([], "dots", boardId);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDots((prev) => [...(prev ?? []), { x, y, color }]);
  }

  function handleClear() {
    setDots([]);
  }

  // Draw dots using a canvas ref effect approach — but since canvas doesn't
  // re-render from React alone, we use an inline approach with a data-uri or
  // we overlay divs. We'll overlay absolutely-positioned divs for simplicity.
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "10px" }}>Board: {boardId}</h1>
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
        <span>Your color: <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", background: color, verticalAlign: "middle", border: "1px solid #999" }} /></span>
        <button
          onClick={handleClear}
          style={{ padding: "6px 16px", cursor: "pointer", background: "#e44", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold" }}
        >
          Clear
        </button>
      </div>
      <div style={{ position: "relative", border: "2px solid #333", borderRadius: "4px", background: "#fff", cursor: "crosshair" }}>
        <canvas
          width={800}
          height={600}
          onClick={handleCanvasClick}
          style={{ display: "block" }}
        />
        {(dots ?? []).map((dot, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: dot.x - 6,
              top: dot.y - 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: dot.color,
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
      <p style={{ marginTop: "8px", color: "#666", fontSize: "13px" }}>Click anywhere on the canvas to draw dots. Dots are shared in real time.</p>
    </div>
  );
}

export function BoardPage({ params }: { params: { boardId: string } }) {
  const boardId = params.boardId;
  return <WhiteboardCanvas boardId={boardId} />;
}
