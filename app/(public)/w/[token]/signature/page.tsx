"use client";

import { useRef, useState, useEffect } from "react";

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111";
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDraw() {
    setIsDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  function submit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const _dataUrl = canvas.toDataURL("image/png");
    // TODO: send dataUrl to API with token
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 text-3xl">✓</div>
        <h1 className="text-lg font-semibold">Handtekening ontvangen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Je kunt dit venster sluiten.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col p-4">
      <h1 className="mb-1 text-lg font-semibold">Handtekening</h1>
      <p className="mb-4 text-sm text-gray-500">
        Teken je handtekening in het vak hieronder.
      </p>

      <div className="relative flex-1 rounded-lg border-2 border-dashed border-gray-300">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-300">
            Teken hier
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={clear}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
        >
          Wissen
        </button>
        <button
          onClick={submit}
          disabled={!hasSignature}
          className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-40 active:bg-gray-800"
        >
          Versturen
        </button>
      </div>
    </div>
  );
}
