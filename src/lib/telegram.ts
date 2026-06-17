/**
 * Telegram Bot notifications.
 *
 * Sends newly-submitted reports as PDFs to a configured Telegram chat.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export interface TelegramSendResult {
  ok: boolean;
  message?: string;
}

export async function sendPdfToTelegram(
  pdfBuffer: Buffer,
  filename: string,
  caption: string
): Promise<TelegramSendResult> {
  if (!BOT_TOKEN || !CHAT_ID) {
    return { ok: false, message: "Telegram bot token or chat ID not configured" };
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;

  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("caption", caption);
  formData.append("document", new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }), filename);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = (await res.json()) as { ok: boolean; description?: string };

  if (!res.ok || !data.ok) {
    return { ok: false, message: data.description || `HTTP ${res.status}` };
  }

  return { ok: true };
}
