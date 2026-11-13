"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  Zap,
  ZapOff,
  ImagePlus,
  ShieldCheck,
  Sparkles,
  RefreshCcw,
} from "lucide-react";
import { GpsStatusPill } from "@/components/camera/GpsStatusPill";
import type { GpsState } from "@/hooks/useHighAccuracyGps";
import {
  useEdgeImageProcessor,
  type EdgeProcessedPhoto,
} from "@/hooks/useEdgeImageProcessor";

export interface CameraViewfinderProps {
  gpsState: GpsState;
  accuracyMeters: number | null;
  qrCodeLabel?: string | null;
  convergenceProgress?: number;
  onRetryGps?: () => void;
  onPhotoProcessed: (photo: EdgeProcessedPhoto) => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  gpsState,
  accuracyMeters,
  qrCodeLabel = null,
  convergenceProgress = 25,
  onRetryGps,
  onPhotoProcessed,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);

  const { processCaptureBlob, isProcessing } = useEdgeImageProcessor();

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopStream();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Acesso direto à câmera requer HTTPS ou uso do botão de captura nativa abaixo."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraReady(true);
      }

      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack && "getCapabilities" in videoTrack) {
        const capabilities =
          videoTrack.getCapabilities() as MediaTrackCapabilities & {
            torch?: boolean;
          };
        setTorchSupported(Boolean(capabilities?.torch));
      }
    } catch {
      setCameraReady(false);
      setCameraError(
        "Câmera ao vivo não autorizada. Toque no botão central para usar a câmera do sistema."
      );
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const toggleTorch = useCallback(async () => {
    const [videoTrack] = streamRef.current?.getVideoTracks() ?? [];
    if (!videoTrack) return;

    const nextTorch = !torchActive;
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchActive(nextTorch);
    } catch {
      setTorchSupported(false);
    }
  }, [torchActive]);

  const handleShutterPress = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isProcessing) return;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(35);
    }

    const videoEl = videoRef.current;
    if (!cameraReady || !videoEl || videoEl.videoWidth === 0) {
      fileInputRef.current?.click();
      return;
    }

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 150);

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = videoEl.videoWidth;
    captureCanvas.height = videoEl.videoHeight;

    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, captureCanvas.width, captureCanvas.height);

    captureCanvas.toBlob(
      async (rawBlob) => {
        if (!rawBlob) return;
        try {
          const processed = await processCaptureBlob(rawBlob);
          onPhotoProcessed(processed);
        } catch (err) {
          console.error("[EcoCidadão] Erro ao processar frame:", err);
        }
      },
      "image/jpeg",
      0.90
    );
  }, [cameraReady, isProcessing, onPhotoProcessed, processCaptureBlob]);

  const handleNativeFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const processed = await processCaptureBlob(file);
        onPhotoProcessed(processed);
      } catch (err) {
        console.error("[EcoCidadão] Erro ao processar arquivo:", err);
      } finally {
        event.target.value = "";
      }
    },
    [onPhotoProcessed, processCaptureBlob]
  );

  return (
    <section
      aria-label="Visor da câmera para registro de descarte irregular"
      className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-zinc-950 text-zinc-50 select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeFileChange}
        className="sr-only"
        aria-hidden="true"
      />

      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 size-full object-cover"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.65)_0%,transparent_24%,transparent_68%,rgba(9,9,11,0.88)_100%)]"
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ease-out",
          shutterFlash ? "opacity-75" : "opacity-0",
        ].join(" ")}
      />

      {/* HUD SUPERIOR */}
      <header className="relative z-20 flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <GpsStatusPill
          state={gpsState}
          accuracyMeters={accuracyMeters}
          qrCodeLabel={qrCodeLabel}
          convergenceProgress={convergenceProgress}
          onRetry={onRetryGps}
        />

        <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/60 px-3 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur-sm">
          <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
          <span>100% Anônimo · EXIF pessoal removido no celular</span>
        </div>
      </header>

      {/* CENTRO: GUIA ÓPTICO */}
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6">
        <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-end rounded-3xl p-4">
          <svg
            aria-hidden="true"
            viewBox="0 0 320 240"
            fill="none"
            className="pointer-events-none absolute inset-0 size-full"
          >
            <rect
              x="2"
              y="2"
              width="316"
              height="236"
              rx="22"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
            <path
              d="M2 34 V24 C2 11.85 11.85 2 24 2 H34"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M286 2 H296 C308.15 2 318 11.85 318 24 V34"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M2 206 V216 C2 228.15 11.85 238 24 238 H34"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M286 238 H296 C308.15 238 318 228.15 318 216 V206"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {cameraError && (
            <div className="my-auto flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/90 text-emerald-400 shadow-md">
                <Camera className="size-6" aria-hidden="true" />
              </div>
              <p className="max-w-[26ch] text-xs leading-relaxed text-zinc-100">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
              >
                <RefreshCcw className="size-3.5" aria-hidden="true" />
                <span>Tentar câmera ao vivo</span>
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-3.5 py-2 text-center backdrop-blur-md">
            <p className="text-xs font-medium tracking-tight text-zinc-100">
              Enquadre o descarte mostrando parte da calçada ou rua
            </p>
          </div>
        </div>
      </div>

      {/* BASE (THUMB ZONE) */}
      <footer className="relative z-20 flex flex-col items-center gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex w-full max-w-xs items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={isProcessing}
            aria-label="Abrir câmera nativa do sistema ou escolher foto"
            className="flex size-14 items-center justify-center rounded-full border border-white/15 bg-zinc-900/80 text-zinc-100 backdrop-blur-md transition-transform duration-150 active:scale-95 disabled:opacity-50"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
          </button>

          {/* OBTURADOR PRINCIPAL */}
          <button
            type="button"
            onClick={handleShutterPress}
            disabled={isProcessing}
            aria-label="Fotografar descarte irregular (Toque 1 de 3)"
            className="group relative flex size-[76px] items-center justify-center rounded-full border-4 border-white/90 bg-white/10 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition-transform duration-150 ease-out active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
          >
            <span
              className={[
                "flex size-16 items-center justify-center rounded-full transition-all duration-150",
                isProcessing
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-white text-zinc-950 group-hover:bg-zinc-100 group-active:scale-90",
              ].join(" ")}
            >
              {isProcessing ? (
                <Sparkles
                  className="size-6 animate-spin text-emerald-950"
                  aria-hidden="true"
                />
              ) : (
                <Camera className="size-7 stroke-[2.2]" aria-hidden="true" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTorch}
            disabled={!torchSupported || isProcessing}
            aria-label={
              torchActive ? "Desligar lanterna" : "Ligar lanterna para foto noturna"
            }
            aria-pressed={torchActive}
            className={[
              "flex size-14 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-150 active:scale-95",
              torchActive
                ? "border-amber-400/60 bg-amber-400/25 text-amber-200"
                : "border-white/15 bg-zinc-900/80 text-zinc-100",
              !torchSupported && "opacity-35",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {torchActive ? (
              <Zap className="size-5 fill-amber-300" aria-hidden="true" />
            ) : (
              <ZapOff className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <p className="text-xs font-medium tracking-tight text-zinc-200">
          {isProcessing
            ? "Otimizando foto e removendo dados pessoais..."
            : "Toque 1 de 3 · Tire a foto para informar o tamanho"}
        </p>
      </footer>
    </section>
  );
};
