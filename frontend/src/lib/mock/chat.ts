import type { ChatResponse } from "../types";
import type { Row } from "../assistant/types";
import { answer } from "../assistant/engine";
import { loadHrDataset } from "../assistant/data";

export const CHAT_GREETING =
  "Merhaba! Ben Veri Analizi Asistanı. CSV verilerinize dair analiz yapmak, soru sormak veya grafikler oluşturmak için bana yazın. Örneğin:";

export const CHAT_SUGGESTIONS = [
  "Departmanlara göre ortalama maaşları göster",
  "Yaş dağılımı histogramını çiz",
  "En yüksek maaşı alan 5 kişiyi listele",
];

export type ChatHistoryItem = { role: string; content: string };

/**
 * Offline / demo assistant: interprets the Turkish question with the in-browser
 * engine over `dataset` (a CSV parsed on the client) or, by default, the bundled
 * Turkish HR dataset fetched lazily from public/data.
 */
export async function mockChat(message: string, history: ChatHistoryItem[] = [], dataset?: Row[]): Promise<ChatResponse> {
  void history; // reserved for follow-up context
  let rows = dataset;
  if (!rows) {
    try {
      rows = await loadHrDataset();
    } catch {
      return { reply: "Örnek veri seti yüklenemedi. Sayfayı yenileyin veya bir CSV dosyası yükleyerek devam edin." };
    }
  }
  return answer(rows, message);
}

/** Synchronous variant for callers that already hold the rows. */
export function chatMock(message: string, dataset: Row[]): ChatResponse {
  return answer(dataset, message);
}
