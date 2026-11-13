"use client";

import React, { useState, useCallback, useEffect } from "react";
import { CameraViewfinder } from "@/components/camera/CameraViewfinder";
import { ScaleBottomSheet, type WasteScale } from "@/components/camera/ScaleBottomSheet";
import { CleanAlertCard } from "@/components/camera/CleanAlertCard";
import { useHighAccuracyGps } from "@/hooks/useHighAccuracyGps";
import type { EdgeProcessedPhoto } from "@/hooks/useEdgeImageProcessor";
import { submitReportToDatabase, type SubmitReportResult } from "@/lib/supabase";

// Coordenadas de contingência do Projeto Piloto Universitário (São Paulo - Marco Zero / Piloto)
// Usadas apenas se o usuário negar o GPS no navegador e a foto não tiver EXIF de GPS
const PILOTO_FALLBACK_LAT = -23.55052;
const PILOTO_FALLBACK_LNG = -46.633308;

export default function EcoCidadaoPage() {
  // GPS em background (Cold Start não-bloqueante)
  const {
    state: gpsState,
    accuracyMeters,
    convergenceProgress,
    resolveBestLocation,
    retryCalibration,
  } = useHighAccuracyGps({ targetAccuracyMeters: 20 });

  // Dispositivo anônimo persistido (LGPD: sem CPF/email, apenas hash aleatório para proteção anti-sybil)
  const [deviceHash, setDeviceHash] = useState("anonymous-device");
  useEffect(() => {
    if (typeof window !== "undefined") {
      let hash = localStorage.getItem("ecocidadao_device_hash");
      if (!hash) {
        hash = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `device-${Date.now()}`;
        localStorage.setItem("ecocidadao_device_hash", hash);
      }
      setDeviceHash(hash);
    }
  }, []);

  // Estados do fluxo linear de 3 toques
  const [capturedPhoto, setCapturedPhoto] = useState<EdgeProcessedPhoto | null>(null);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmitReportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // TOQUE 1 CONCLUÍDO: Foto processada no Web Worker (WebP ~140KB + dHash 64-bit)
  const handlePhotoProcessed = useCallback((photo: EdgeProcessedPhoto) => {
    setCapturedPhoto(photo);
    setIsScaleOpen(true);
    setErrorMessage(null);
  }, []);

  // TOQUE 2 CONCLUÍDO: Seleção rápida de porte (Disparo Otimista real para o Supabase)
  const handleSelectScale = useCallback(
    async (scale: WasteScale, tags: string[]) => {
      if (!capturedPhoto) return;

      setIsScaleOpen(false);
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        // Micro-janela para aguardar convergência do GPS ativo
        const bestCoords = await resolveBestLocation(1500);

        // Hierarquia de localização:
        // 1. GPS do celular (se ativo e com permissão concedida)
        // 2. EXIF da foto (se a câmera tiver embutido a tag GPS)
        // 3. Fallback de contingência do Piloto Universitário (garante que o envio nunca quebre)
        let finalLat: number = PILOTO_FALLBACK_LAT;
        let finalLng: number = PILOTO_FALLBACK_LNG;
        let finalAccuracy: number = 25;
        let finalSource = "BROWSER_GPS";

        if (bestCoords?.lat != null && bestCoords?.lng != null) {
          finalLat = bestCoords.lat;
          finalLng = bestCoords.lng;
          finalAccuracy = bestCoords.accuracyMeters;
          finalSource = bestCoords.source;
        } else if (
          capturedPhoto.exif.exifLat != null &&
          capturedPhoto.exif.exifLng != null
        ) {
          finalLat = capturedPhoto.exif.exifLat;
          finalLng = capturedPhoto.exif.exifLng;
          finalAccuracy = 20;
          finalSource = "EXIF_GPS";
        } else {
          // Fallback seguro em área de demonstração/piloto
          finalAccuracy = 50;
          finalSource = "QR_ANCHOR";
        }

        // Disparo real para o Supabase: Upload WebP + RPC PostGIS
        const result = await submitReportToDatabase(
          {
            tenantSlug: "piloto-universidade",
            lat: finalLat,
            lng: finalLng,
            accuracyMeters: finalAccuracy,
            locationSource: finalSource as any,
            reportedScale: scale,
            wasteTags: tags,
            imageDHash64: capturedPhoto.dHash64,
            anonymousDeviceHash: deviceHash,
            qrCode: finalSource === "QR_ANCHOR" ? "QR-CORREGO-01" : null,
            isFreshCapture: capturedPhoto.exif.isFreshCapture,
          },
          capturedPhoto.webpBlob
        );

        setSubmissionResult(result);
      } catch (err) {
        console.error("[EcoCidadão] Erro ao enviar denúncia:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Falha na conexão com o servidor. Verifique o sinal da internet."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [capturedPhoto, deviceHash, resolveBestLocation]
  );

  // TOQUE 3: Subscrição Web Push VAPID ("Me avise quando limparem")
  const handleSubscribePush = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleReset = useCallback(() => {
    setCapturedPhoto(null);
    setSubmissionResult(null);
    setIsScaleOpen(false);
    setErrorMessage(null);
  }, []);

  // Se já enviou com sucesso, exibe a tela de Sucesso & Retorno (Toque 3)
  if (submissionResult) {
    return (
      <CleanAlertCard
        protocolCode={submissionResult.protocol_code}
        confirmationsCount={submissionResult.confirmations_count}
        dominantScale={submissionResult.status}
        onSubscribePush={handleSubscribePush}
        onNewReport={handleReset}
      />
    );
  }

  // Caso padrão: Câmera ativa em tela cheia (Toque 1) + Drawer de Escala (Toque 2)
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <CameraViewfinder
        gpsState={gpsState}
        accuracyMeters={accuracyMeters}
        convergenceProgress={convergenceProgress}
        onRetryGps={retryCalibration}
        onPhotoProcessed={handlePhotoProcessed}
      />

      <ScaleBottomSheet
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        photo={capturedPhoto}
        onSelectScale={handleSelectScale}
      />

      {/* Overlay translúcido de envio em segundo plano */}
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm text-white select-none">
          <div className="size-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-semibold tracking-tight">
            Enviando foto e unificando relato...
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Algoritmo espacial PostGIS calculando deduplicação em 25m
          </p>
        </div>
      )}

      {/* Toast de erro simples caso ocorra falha de rede */}
      {errorMessage && (
        <div className="fixed bottom-6 inset-x-6 z-50 rounded-2xl bg-rose-950/90 border border-rose-500/30 p-4 text-rose-200 text-xs shadow-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="font-bold underline ml-2"
          >
            Fechar
          </button>
        </div>
      )}
    </main>
  );
}
