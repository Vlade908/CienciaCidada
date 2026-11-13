"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Camera,
  Zap,
  ZapOff,
  ImagePlus,
  ShieldCheck,
  RefreshCcw,
  Search,
  X,
  MapPin,
  Sparkles,
} from "lucide-react";
import { QrAnchorBanner } from "@/components/camera/QrAnchorBanner";
import type { GpsState } from "@/hooks/useHighAccuracyGps";
import type { QrAnchorData } from "@/lib/qrAnchors";
import {
  useEdgeImageProcessor,
  type EdgeProcessedPhoto,
} from "@/hooks/useEdgeImageProcessor";

export interface CameraViewfinderProps {
  gpsState: GpsState;
  accuracyMeters: number | null;
  qrCodeLabel?: string | null;
  qrAnchor?: QrAnchorData | null;
  convergenceProgress?: number;
  onRetryGps?: () => void;
  onPhotoProcessed: (photo: EdgeProcessedPhoto) => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  gpsState,
  accuracyMeters,
  qrCodeLabel = null,
  qrAnchor = null,
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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

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
        "Acesso direto à câmera requer HTTPS ou uso do botão de galeria/captura nativa abaixo."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
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
        "Câmera ao vivo não autorizada. Toque no botão central ou use a galeria."
      );
    }
  }, [stopStream, facingMode]);

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

  const toggleFlipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

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
    setTimeout(() => setShutterFlash(false), 120);

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

  const isGpsLocked = gpsState === "LOCKED" || gpsState === "QR_ANCHORED" || Boolean(qrAnchor);

  return (
    <section
      aria-label="Visor da câmera para registro de descarte irregular"
      className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-black text-white select-none"
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

      {/* VÍDEO FULL-SCREEN */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 size-full object-cover z-0"
      />

      {/* OVERLAYS CINEMATOGRÁFICOS STITCH */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-10" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" 
      />

      {/* GRADE 3X3 DE ENQUADRAMENTO SUTIL (RULE OF THIRDS) */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 z-10 opacity-20"
      >
        <div className="border-r border-b border-white/60" />
        <div className="border-r border-b border-white/60" />
        <div className="border-b border-white/60" />
        <div className="border-r border-b border-white/60" />
        <div className="border-r border-b border-white/60" />
        <div className="border-b border-white/60" />
        <div className="border-r border-b border-white/60" />
        <div className="border-r border-b border-white/60" />
        <div />
      </div>

      {/* TOP HUD: NAVEGAÇÃO, TELEMETRIA GPS E FLASH STITCH */}
      <header className="relative z-30 pt-[max(1rem,env(safe-area-inset-top))] px-4 flex flex-col gap-2">
        <div className="flex items-center justify-between w-full max-w-sm mx-auto">
          {/* Botão Fechar / Voltar à Home */}
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl text-white border border-white/15 flex items-center justify-center active:scale-90 transition-all shadow-md"
            title="Fechar câmera e voltar para a Central"
            aria-label="Fechar câmera"
          >
            <X className="w-5 h-5" />
          </Link>

          {/* Telemetria GPS Stitch com Ping Verde */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <span className="relative flex h-2 w-2 shrink-0">
              {isGpsLocked && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isGpsLocked ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>

            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isGpsLocked ? 'text-emerald-400' : 'text-amber-400'}`} />

            <div className="flex flex-col text-left">
              <span className="text-[11px] text-white font-bold leading-none tracking-tight">
                {qrAnchor 
                  ? `Placa ${qrAnchor.code}` 
                  : isGpsLocked 
                    ? `GPS Travado (±${Math.round(accuracyMeters || 5)}m)` 
                    : "Calibrando GPS..."}
              </span>
              <span className="text-[9px] text-white/70 leading-none mt-0.5 font-mono">
                {qrAnchor?.addressHint ? "Ponto Físico Monitorado" : "São Paulo, SP"}
              </span>
            </div>
          </div>

          {/* Botão de Flash / Lanterna */}
          <button
            type="button"
            onClick={toggleTorch}
            disabled={!torchSupported || isProcessing}
            className={`w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl border border-white/15 flex flex-col items-center justify-center active:scale-90 transition-all shadow-md ${
              !torchSupported ? 'opacity-40' : ''
            }`}
            title={torchActive ? "Desligar lanterna" : "Ligar lanterna"}
            aria-label="Alternar flash"
          >
            {torchActive ? (
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            ) : (
              <ZapOff className="w-4 h-4 text-white" />
            )}
            <span className="text-[7px] font-bold text-emerald-400 leading-none -mt-0.5">
              {torchActive ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* BANNER DE ÂNCORA QR CODE (SE PRESENTE) */}
        {qrAnchor && (
          <div className="w-full max-w-sm mx-auto pt-1">
            <QrAnchorBanner anchor={qrAnchor} />
          </div>
        )}
      </header>

      {/* CENTRO: MENSAGEM / GUIAS DE ENQUADRAMENTO */}
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 pointer-events-none">
        {cameraError && (
          <div className="pointer-events-auto my-auto flex flex-col items-center gap-3 text-center bg-black/70 backdrop-blur-md p-5 rounded-2xl border border-white/15">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/90 text-emerald-400 shadow-md">
              <Camera className="size-6" />
            </div>
            <p className="max-w-[26ch] text-xs leading-relaxed text-zinc-200">
              {cameraError}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <RefreshCcw className="size-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM HUD: GALERIA, SHUTTER IPHONE E FLIP STITCH */}
      <footer className="relative z-30 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 flex flex-col items-center gap-3.5 mb-2">
        
        {/* GUIA DE INSTRUÇÃO DISCRETO */}
        <div className="rounded-full border border-white/15 bg-black/60 px-4 py-1.5 backdrop-blur-md shadow-md">
          <p className="text-[11px] font-medium text-white/90">
            {isProcessing ? "Otimizando imagem WebP..." : "Enquadre o entulho e aperte o botão branco"}
          </p>
        </div>

        {/* FILEIRA DE CONTROLES DO OBTURADOR STITCH */}
        <div className="w-full max-w-xs flex items-center justify-around px-2">
          
          {/* Botão de Galeria de Fotos */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
              aria-label="Abrir galeria de fotos"
              className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 p-1 active:scale-90 transition-transform shadow-xl flex items-center justify-center disabled:opacity-50"
            >
              <ImagePlus className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-white/70 mt-1 font-medium">Galeria</span>
          </div>

          {/* OBTURADOR ESTILO IPHONE STITCH (80px) */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={handleShutterPress}
              disabled={isProcessing}
              aria-label="Tirar foto do descarte"
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-transform duration-100 shadow-[0_4px_24px_rgba(0,0,0,0.6)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
            >
              <div className="w-full h-full rounded-full bg-white active:bg-zinc-200 transition-colors flex items-center justify-center">
                {isProcessing && (
                  <Sparkles className="w-6 h-6 animate-spin text-zinc-950" />
                )}
              </div>
            </button>
          </div>

          {/* Botão de Inverter Câmera (Flip) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={toggleFlipCamera}
              disabled={isProcessing}
              aria-label="Inverter câmera"
              className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center active:rotate-180 transition-transform duration-300 shadow-xl disabled:opacity-50"
            >
              <RefreshCcw className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-white/70 mt-1 font-medium">Girar</span>
          </div>

        </div>

        {/* RODAPÉ DE PRIVACIDADE E ANONIMATO LGPD STITCH */}
        <div className="flex items-center justify-center gap-1.5 opacity-85 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-white/80 font-medium tracking-tight text-center">
            Reporte 100% Anônimo • Metadados protegidos pela LGPD
          </span>
        </div>

      </footer>

      {/* SIMULAÇÃO DE FLASH BRANCO DE OBTURADOR */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 z-50 ${
          shutterFlash ? "opacity-85" : "opacity-0"
        }`}
      />
    </section>
  );
};
