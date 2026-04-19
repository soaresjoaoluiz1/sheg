"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, RotateCcw, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
}

export function CameraCapture({ value, onChange, label = "Foto" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera(mode: "environment" | "user" = facingMode) {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setFacingMode(mode);
    } catch (err) {
      toast.error("Não consegui acessar a câmera. Use o upload de arquivo.");
      console.error(err);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }

  useEffect(() => () => stopCamera(), []);

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onChange(dataUrl);
    stopCamera();
  }

  function clear() {
    onChange(null);
  }

  function onFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
    ev.target.value = "";
  }

  if (value) {
    return (
      <div className="space-y-3">
        <span className="text-sm font-medium">{label}</span>
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          <img src={value} alt={label} className="w-full max-h-64 object-contain" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={clear}
            aria-label="Remover foto"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="rounded-lg border bg-muted/30 overflow-hidden">
        {streaming ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full max-h-64 object-cover bg-black"
            />
            <div className="p-2 flex items-center gap-2 flex-wrap">
              <Button type="button" onClick={capture} className="gap-2">
                <Camera className="size-3.5" aria-hidden />
                Capturar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => startCamera(facingMode === "environment" ? "user" : "environment")}
                className="gap-2"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Virar
              </Button>
              <Button type="button" variant="ghost" onClick={stopCamera}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 flex flex-col sm:flex-row gap-2 items-stretch">
            <Button type="button" onClick={() => startCamera()} className="gap-2 flex-1">
              <Camera className="size-3.5" aria-hidden />
              Abrir câmera
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="gap-2 flex-1"
            >
              <Upload className="size-3.5" aria-hidden />
              Enviar arquivo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFile}
              className="hidden"
            />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  );
}
