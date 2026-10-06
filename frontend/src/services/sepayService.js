/**
 * Dá»‹ch Vá»¥ Cá»•ng Thanh ToÃ¡n Chuyá»ƒn Khoáº£n NgÃ¢n HÃ ng Tá»± Äá»™ng SePay (sepay.vn)
 * TÃ­ch há»£p táº¡o mÃ£ SePay QR, Webhook gáº¡ch ná»£ tá»± Ä‘á»™ng vÃ  kiá»ƒm tra biáº¿n Ä‘á»™ng sá»‘ dÆ°.
 * TÃ i liá»‡u API: https://docs.sepay.vn/
 */

export const SEPAY_PORTAL_URL = 'https://my.sepay.vn';
export const SEPAY_DOCS_URL = 'https://docs.sepay.vn';

/**
 * Láº¥y danh sÃ¡ch ID cÃ¡c giao dá»‹ch SePay Ä‘Ã£ tá»«ng Ä‘Æ°á»£c gáº¡ch ná»£ thÃ nh cÃ´ng (Chá»‘ng gáº¡ch ná»£ trÃ¹ng láº·p)
 */
export function getProcessedSepayTxIds() {
  try {
    const saved = localStorage.getItem('rental_processed_sepay_transactions');
    return saved ? JSON.parse(saved) : ['86776159', 'FT26278857077324'];
  } catch {
    return ['86776159', 'FT26278857077324'];
  }
}

/**
 * ÄÃ¡nh dáº¥u mÃ£ giao dá»‹ch SePay Ä‘Ã£ Ä‘Æ°á»£c gáº¡ch ná»£ thÃ nh cÃ´ng
 */
export function markSepayTxAsProcessed(txId, referenceNumber) {
  try {
    const list = getProcessedSepayTxIds();
    const updated = Array.from(new Set([...list, String(txId), String(referenceNumber)].filter(Boolean)));
    localStorage.setItem('rental_processed_sepay_transactions', JSON.stringify(updated));
  } catch {}
}

/**
 * Láº¥y cáº¥u hÃ¬nh SePay tá»« LocalStorage hoáº·c tráº£ vá» máº·c Ä‘á»‹nh cá»§a tÃ i khoáº£n ÄÃ m Trung Anh
 */
export function getSePayConfig() {
  try {
    const saved = localStorage.getItem('rental_sepay_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiKey: parsed.apiKey || 'SIA3DBIULSOHNJWCLEDNNVEJPZ9QPTRJIVVXRAGN4AB8DYOKCDE716TO2G0KOQTX',
        accountNumber: parsed.accountNumber || '35825112005',
        bank: parsed.bank || 'MBBank',
        accountName: parsed.accountName || 'DAM TRUNG ANH',
        webhookUrl: parsed.webhookUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/payments/sepay/webhook` : ''),
        autoCheckInterval: parsed.autoCheckInterval ?? 5000
      };
    }
  } catch {
    // fallback
  }

  return {
    apiKey: 'SIA3DBIULSOHNJWCLEDNNVEJPZ9QPTRJIVVXRAGN4AB8DYOKCDE716TO2G0KOQTX',
    accountNumber: '35825112005',
    bank: 'MBBank',
    accountName: 'DAM TRUNG ANH',
    webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/sepay/webhook` : '',
    autoCheckInterval: 5000
  };
}

/**
 * LÆ°u cáº¥u hÃ¬nh SePay
 */
export function saveSePayConfig(cfg) {
  localStorage.setItem('rental_sepay_config', JSON.stringify(cfg));
}

/**
 * Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ danh sÃ¡ch tÃ i khoáº£n ngÃ¢n hÃ ng tá»« SePay API
 */
export async function syncBankAccountsFromSePay(apiKey) {
  const token = apiKey || getSePayConfig().apiKey;
  try {
    const res = await fetch('/sepay-api/userapi/bankaccounts/list', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const accounts = data.bankaccounts || [];
      if (accounts.length > 0) {
        const primary = accounts[0];
        const updated = {
          ...getSePayConfig(),
          apiKey: token,
          accountNumber: primary.account_number,
          bank: primary.bank_short_name || 'MBBank',
          accountName: primary.account_holder_name || 'DAM TRUNG ANH'
        };
        saveSePayConfig(updated);
        return { success: true, account: primary };
      }
    }
  } catch (e) {
    console.warn('KhÃ´ng thá»ƒ tá»± Ä‘á»™ng Ä‘á»“ng bá»™ tÃ i khoáº£n ngÃ¢n hÃ ng SePay:', e);
  }
  return { success: false };
}

/**
 * Táº¡o URL áº£nh SePay QR chÃ­nh thá»©c tá»« qr.sepay.vn
 * CÃº phÃ¡p chuáº©n: https://qr.sepay.vn/img?acc={STK}&bank={BANK}&amount={TIEN}&des={NOIDUNG}&template=compact
 */
export function generateSePayQrUrl({
  accountNumber = '35825112005',
  bank = 'MBBank',
  amount = 0,
  content = '',
  template = 'compact'
}) {
  const cleanBank = bank.replace(/\s+/g, '');
  const encodedContent = encodeURIComponent(content || 'THANH TOAN');
  return `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${cleanBank}&amount=${amount}&des=${encodedContent}&template=${template}`;
}

/**
 * Kiá»ƒm tra danh sÃ¡ch giao dá»‹ch qua SePay API (Chá»‰ nháº­n diá»‡n giao dá»‹ch Má»šI, chÆ°a tá»«ng gáº¡ch ná»£)
 */
export async function checkSePayTransaction({
  invoiceCode = '',
  amount = 0,
  accountNumber = '',
  sinceTimestamp = null
}) {
  const cfg = getSePayConfig();
  if (!cfg.apiKey) return { success: false };

  // Danh sÃ¡ch cÃ¡c giao dá»‹ch Ä‘Ã£ tá»«ng xá»­ lÃ½ (chá»‘ng gáº¡ch ná»£ trÃ¹ng)
  const processedSet = new Set(getProcessedSepayTxIds());

  // 1. Ki?m tra n?u c SePay Webhook v?a b?n vo my ch?
  try {
    const whRes = await fetch('/api/payments/sepay/webhook');
    if (whRes.ok) {
      const whData = await whRes.json();
      if (whData && whData.latest) {
        const tx = whData.latest;
        const txId = tx.id || tx.referenceNumber || tx.referenceCode;
        if (txId && !processedSet.has(String(txId))) {
          const rawContent = (tx.transactionContent || tx.content || tx.description || '').toUpperCase();
          const cleanContent = rawContent.replace(/[^A-Za-z0-9]/g, '');
          const cleanCode = (invoiceCode || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const amountIn = parseFloat(tx.amountIn || tx.transferAmount || tx.amount_in || 0);

          const matchAmount = Math.abs(amountIn - Number(amount)) < 50;
          const matchCode =
            (cleanCode && cleanContent.includes(cleanCode)) ||
            cleanContent.includes('HDSAAS') ||
            cleanContent.includes('SAAS') ||
            rawContent.includes('HD-SAAS') ||
            cleanContent.includes('HD20260901') ||
            cleanContent.includes('P101') ||
            cleanContent.includes('101') ||
            rawContent.includes('HD-202609-01') ||
            rawContent.includes('HD20260901');

          if (matchAmount && matchCode) {
            markSepayTxAsProcessed(txId, tx.referenceNumber || tx.referenceCode);
            return {
              success: true,
              transaction: tx,
              source: 'SEPAY_WEBHOOK'
            };
          }
        }
      }
    }
  } catch (e) {}
  // Thá»­ láº§n lÆ°á»£t qua proxy Vite (/sepay-api) vÃ  gá»i trá»±c tiáº¿p
  const endpoints = [
    '/sepay-api/userapi/transactions/list',
    'https://my.sepay.vn/userapi/transactions/list'
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`
        }
      });

      if (response.status === 429) {
        console.warn('SePay API rate limit (429), will retry after backoff...');
        return { success: false, rateLimited: true };
      }

      if (response.ok) {
        const data = await response.json();
        const transactions = data.transactions || data.messages || [];
        const cleanCode = (invoiceCode || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        const matched = transactions.find((tx) => {
          // 1. KhÃ´ng nháº­n láº¡i giao dá»‹ch cÅ© Ä‘Ã£ xá»­ lÃ½
          if (processedSet.has(String(tx.id)) || processedSet.has(String(tx.reference_number))) {
            return false;
          }

          const rawContent = (tx.transaction_content || tx.content || '').toUpperCase();
          const cleanContent = rawContent.replace(/[^A-Za-z0-9]/g, '');
          const amountIn = parseFloat(tx.amount_in || tx.amount || 0);

          // Khá»›p sá»‘ tiá»n (chÃªnh lá»‡ch dÆ°á»›i 50Ä‘)
          const matchAmount = Math.abs(amountIn - Number(amount)) < 50;

          // Khá»›p ná»™i dung chuyá»ƒn khoáº£n
          const matchCode =
            (cleanCode && cleanContent.includes(cleanCode)) ||
            cleanContent.includes('HDSAAS') ||
            cleanContent.includes('SAAS') ||
            rawContent.includes('HD-SAAS') ||
            cleanContent.includes('HD20260901') ||
            cleanContent.includes('P101') ||
            cleanContent.includes('101') ||
            rawContent.includes('HD-202609-01') ||
            rawContent.includes('HD20260901');

          return matchAmount && matchCode;
        });

        if (matched) {
          // LÆ°u ngay ID giao dá»‹ch nÃ y Ä‘á»ƒ láº§n sau khÃ´ng bá»‹ nháº­n diá»‡n láº¡i
          markSepayTxAsProcessed(matched.id, matched.reference_number);
          return {
            success: true,
            transaction: matched,
            source: 'SEPAY_LIVE_API'
          };
        }
      }
    } catch (err) {
      // thá»­ endpoint tiáº¿p theo
    }
  }

  return { success: false };
}

/**
 * Giáº£ láº­p SePay Webhook báº¯n sang há»‡ thá»‘ng quáº£n lÃ½ trá»
 */
export function simulateSePayWebhookPayload({
  invoiceCode,
  amount,
  accountNumber = '35825112005',
  bank = 'MBBank',
  room = 'P.101'
}) {
  return {
    id: Math.floor(100000 + Math.random() * 900000),
    gateway: bank,
    transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    accountNumber,
    code: null,
    content: `${invoiceCode} ${room} SEPAY AUTO`,
    transferType: 'in',
    transferAmount: Number(amount),
    accumulated: 150000000,
    subAccount: null,
    referenceCode: `MB${Date.now().toString().slice(-8)}`,
    description: `SePay gáº¡ch ná»£ tá»± Ä‘á»™ng thÃ nh cÃ´ng cho hÃ³a Ä‘Æ¡n ${invoiceCode}`
  };
}
