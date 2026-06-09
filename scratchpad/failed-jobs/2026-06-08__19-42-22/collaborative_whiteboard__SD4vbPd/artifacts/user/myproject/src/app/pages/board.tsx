"use client";

import React, { useRef, useEffect } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

export const Board = ({ params }: { params: { boardId: string } }) => {
  const boardId = params.boardId;
  const [dots, setDots] = useSyncedState<{ x: number, y: number, color: string }[]>([], "dots", boardId);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dots.forEach(dot => {
      ctx.fillStyle = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [dots]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDots(prev => [...prev, { x, y, color: "red" }]);
  };

  const handleClear = () => {
    setDots([]);
  };

  return (
    <div>
      <h1>Board {boardId}</h1>
      <button onClick={handleClear}>Clear</button>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid black", display: "block", marginTop: "10px" }}
        onClick={handleCanvasClick}
      />
    </div>
  );
};
