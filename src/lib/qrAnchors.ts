/**
 * Catálogo de Âncoras Físicas de QR Code (Piloto Universitário & Pontos Críticos)
 * Cada placa física instalada na cidade possui coordenada pré-calibrada e endereço humano
 * para guiar as equipes de coleta mesmo em áreas com instabilidade de satélite GNSS.
 */

export interface QrAnchorData {
  code: string;
  lat: number;
  lng: number;
  addressHint: string;
  isEcoCritical: boolean;
  description: string;
}

export const KNOWN_QR_ANCHORS: Record<string, QrAnchorData> = {
  'QR-CORREGO-01': {
    code: 'QR-CORREGO-01',
    lat: -23.55052,
    lng: -46.633308,
    addressHint: 'Margem do Córrego Limpo, próx. ao Viaduto',
    isEcoCritical: true,
    description: 'Ponto Crítico de Descarte e Risco Hídrico',
  },
  'QR-PRACA-02': {
    code: 'QR-PRACA-02',
    lat: -23.5521,
    lng: -46.6351,
    addressHint: 'Esquina da Praça Central com Rua das Flores',
    isEcoCritical: false,
    description: 'Ponto de Descarte Viciado de Móveis e Volumosos',
  },
  'QR-ECOPONTO-03': {
    code: 'QR-ECOPONTO-03',
    lat: -23.5542,
    lng: -46.6318,
    addressHint: 'Avenida dos Estados com Travessa da Esperança',
    isEcoCritical: true,
    description: 'Ponto Crítico de Entulho e Descarte da Construção',
  },
};

/**
 * Localiza os dados georreferenciados de uma âncora QR Code
 * @param code Código lido pela URL (Ex: 'QR-CORREGO-01')
 */
export function getQrAnchorByCode(code: string | null | undefined): QrAnchorData | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return KNOWN_QR_ANCHORS[normalized] || null;
}
