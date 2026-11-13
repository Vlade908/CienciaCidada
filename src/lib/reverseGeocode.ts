/**
 * Utilitário de Geocodificação Reversa para o EcoCidadão (Free-Tier & Open-Source)
 * 
 * Conforme especificado no documento de arquitetura (docs/02-arquitetura-free-to-paid-e-dados.md, Seção 2),
 * utiliza OpenStreetMap Nominatim e BigDataCloud (ambos gratuitos, sem necessidade de chaves de API pagas)
 * com cache local e degradação suave, descobrindo em tempo real a cidade, estado e rua do munícipe.
 */

export interface GeocodeResult {
  city: string;
  state: string;
  cityState: string;
  neighborhood?: string;
  street?: string;
  fullAddress: string;
  displayName: string;
}

// Cache em memória durante a sessão da aplicação
const memoryGeocodeCache = new Map<string, GeocodeResult>();

// Mapeamento de nomes de estados brasileiros para siglas oficiais
const BRAZIL_STATES_MAP: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapá: "AP",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceará: "CE",
  ceara: "CE",
  "distrito federal": "DF",
  "espírito santo": "ES",
  "espirito santo": "ES",
  goiás: "GO",
  goias: "GO",
  maranhão: "MA",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  pará: "PA",
  para: "PA",
  paraíba: "PB",
  paraiba: "PB",
  paraná: "PR",
  parana: "PR",
  pernambuco: "PE",
  piauí: "PI",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondônia: "RO",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "são paulo": "SP",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

function normalizeStateCode(rawState: string | undefined): string {
  if (!rawState) return "SP";
  const clean = rawState.trim();
  if (clean.length === 2) return clean.toUpperCase();
  const lower = clean.toLowerCase();
  return BRAZIL_STATES_MAP[lower] || clean;
}

function getCacheKey(lat: number, lng: number): string {
  // Precisão de ~100m para reaproveitamento agressivo de cache
  return `geo_${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

/**
 * Consulta a geocodificação reversa de um ponto GPS (lat, lng).
 * Tenta Nominatim (OSM) e em seguida BigDataCloud.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const cacheKey = getCacheKey(lat, lng);

  // 1. Checa memória
  if (memoryGeocodeCache.has(cacheKey)) {
    return memoryGeocodeCache.get(cacheKey)!;
  }

  // 2. Checa sessionStorage
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as GeocodeResult;
        memoryGeocodeCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch {
      // Ignora erro de storage
    }
  }

  // 3. Tenta OpenStreetMap Nominatim (timeout 2.8s)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.county ||
        "Região Metropolitana";
      const rawState = addr.state || "SP";
      const state = normalizeStateCode(rawState);
      const street = addr.road || addr.pedestrian || addr.footway || undefined;
      const neighborhood =
        addr.suburb || addr.neighbourhood || addr.residential || undefined;

      const cityState = `${city}, ${state}`;
      let displayName = cityState;

      if (street && neighborhood) {
        displayName = `${street}, ${neighborhood} • ${cityState}`;
      } else if (street) {
        displayName = `${street} • ${cityState}`;
      } else if (neighborhood) {
        displayName = `${neighborhood} • ${cityState}`;
      } else {
        displayName = `${cityState} • Ponto georreferenciado`;
      }

      const result: GeocodeResult = {
        city,
        state,
        cityState,
        neighborhood,
        street,
        fullAddress: data?.display_name || displayName,
        displayName,
      };

      saveToCache(cacheKey, result);
      return result;
    }
  } catch {
    // Falha silenciosa no OSM, tenta provedor alternativo
  }

  // 4. Provedor Secundário Gratuito: BigDataCloud Reverse Geocoding Client API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lng)}&localityLanguage=pt`;

    const res = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const city =
        data.locality ||
        data.city ||
        data.principalSubdivision ||
        "Região Georreferenciada";
      const state = normalizeStateCode(
        data.principalSubdivisionCode || data.principalSubdivision
      );
      const cityState = `${city}, ${state}`;
      const displayName = `${cityState} • Ponto georreferenciado`;

      const result: GeocodeResult = {
        city,
        state,
        cityState,
        fullAddress: displayName,
        displayName,
      };

      saveToCache(cacheKey, result);
      return result;
    }
  } catch {
    // Provedor secundário indisponível
  }

  // 5. Degradação Graciosa: Ponto válido por satélite sem forçar "São Paulo, SP"
  const fallbackResult: GeocodeResult = {
    city: "Local via GPS",
    state: "BR",
    cityState: "Local via GPS",
    fullAddress: "Ponto georreferenciado via satélite",
    displayName: "Ponto georreferenciado via satélite",
  };

  return fallbackResult;
}

function saveToCache(cacheKey: string, result: GeocodeResult) {
  memoryGeocodeCache.set(cacheKey, result);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Quota de sessionStorage excedida ou navegação restrita
    }
  }
}
