import CryptoJS from 'crypto-js';

const SECRET = process.env.ENCRYPTION_KEY || 'opsflow-aes-256-secret-key-32chars!!';

// ── Encryption ─────────────────────────────
export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
};

export const decrypt = (cipherText: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// ── Pagination ─────────────────────────────
export const getPagination = (page?: string, limit?: string) => {
  const p = Math.max(1, parseInt(page || '1'));
  const l = Math.min(100, Math.max(1, parseInt(limit || '10')));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => ({
  data,
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1
});

// ── Search filter builder ──────────────────
export const buildSearchFilter = (search: string | undefined, fields: string[]) => {
  if (!search) return {};
  return {
    OR: fields.map(f => ({
      [f]: { contains: search, mode: 'insensitive' as const }
    }))
  };
};

// ── Response helpers ───────────────────────
export const success = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message
});

export const fail = (error: string, status = 400) => ({
  success: false,
  error,
  status
});
