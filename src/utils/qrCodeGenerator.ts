import QRCode from 'qrcode';

/**
 * Generates an authentic ISO 18004 QR code boolean matrix using `qrcode`.
 */
export function generateQrMatrix(text: string): boolean[][] {
  try {
    const qr = QRCode.create(text || 'UISA', { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const matrix: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        row.push(Boolean(data[r * size + c]));
      }
      matrix.push(row);
    }
    return matrix;
  } catch {
    // Minimal 21x21 fallback matrix if encoding fails unexpectedly
    return Array.from({ length: 21 }, () => Array(21).fill(false));
  }
}

export async function generateQrDataUrl(text: string, width: number = 320): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export function buildEquipmentQrPayload(kind: 'extintor' | 'hidrante', code: string): string {
  const prefix = kind === 'extintor' ? 'UISA:EXT:' : 'UISA:HID:';
  return `${prefix}${code.trim().toUpperCase()}`;
}

/**
 * Extracts equipment code/identifier from various QR formats:
 * - "UISA:EXT:EXT-IND-01"
 * - "UISA:HID:HID-01"
 * - "EXTINTORPRO:EXT-IND-01|SERIE:...|SELO:..."
 * - JSON: { "code": "EXT-IND-01" }
 * - URL with ?code=... or trailing tag
 * - Raw code string: "EXT-IND-01" or "HID-01"
 */
export function parseEquipmentQrPayload(raw: string): {
  kind?: 'extintor' | 'hidrante';
  code: string;
  raw: string;
} {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { code: '', raw: trimmed };

  const upper = trimmed.toUpperCase();

  if (upper.startsWith('UISA:EXT:')) {
    const rest = trimmed.slice('UISA:EXT:'.length).split('|')[0].trim();
    return { kind: 'extintor', code: rest.toUpperCase(), raw: trimmed };
  }

  if (upper.startsWith('UISA:HID:')) {
    const rest = trimmed.slice('UISA:HID:'.length).split('|')[0].trim();
    return { kind: 'hidrante', code: rest.toUpperCase(), raw: trimmed };
  }

  if (upper.startsWith('EXTINTORPRO:')) {
    const rest = trimmed.slice('EXTINTORPRO:'.length).split('|')[0].trim();
    return { kind: 'extintor', code: rest.toUpperCase(), raw: trimmed };
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const code = String(parsed.code || parsed.tag || parsed.id || '').trim().toUpperCase();
      if (code) {
        return {
          kind: parsed.kind === 'hidrante' ? 'hidrante' : parsed.kind === 'extintor' ? 'extintor' : undefined,
          code,
          raw: trimmed,
        };
      }
    } catch {
      // fall through
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      const paramCode = u.searchParams.get('code') || u.searchParams.get('tag') || u.searchParams.get('id');
      if (paramCode) return { code: paramCode.trim().toUpperCase(), raw: trimmed };
    } catch {
      // fall through
    }
  }

  return { code: upper, raw: trimmed };
}
