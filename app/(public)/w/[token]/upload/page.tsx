"use client";

import { useState, useRef } from "react";

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function submit() {
    if (!file) return;
    // TODO: upload file to API with token
    setSubmitted(true);
    setTimeout(() => {
      window.location.href = "https://wa.me/32456820441";
    }, 3000);
  }

  function reset() {
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 text-3xl">✓</div>
        <h1 className="text-lg font-semibold">Foto ontvangen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Je kunt dit venster sluiten.
        </p>
        <a
          href="https://wa.me/32456820441"
          className="mt-4 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white active:bg-gray-800"
        >
          Terug naar WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col p-4">
      <h1 className="mb-1 text-lg font-semibold">Foto uploaden</h1>
      <p className="mb-4 text-sm text-gray-500">
        Maak een foto of kies er één uit je galerij.
      </p>

      {!preview ? (
        <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center active:bg-gray-50">
          <div className="mb-2 text-3xl text-gray-300">📷</div>
          <span className="text-sm font-medium text-gray-600">
            Tik om een foto te kiezen
          </span>
          <span className="mt-1 text-xs text-gray-400">
            JPG, PNG of HEIC
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="relative flex-1 overflow-hidden rounded-lg border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {preview ? (
          <>
            <button
              onClick={reset}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Opnieuw
            </button>
            <button
              onClick={submit}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white active:bg-gray-800"
            >
              Versturen
            </button>
          </>
        ) : (
          <div className="h-12" /> // spacer to keep layout stable
        )}
      </div>
    </div>
  );
}
