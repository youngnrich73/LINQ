export interface SuggestionTemplate {
  id: string;
  minRecencyDays: number;
  maxRecencyDays: number;
  minEmotion: number;
  maxEmotion: number;
  minFrequency: number;
  maxFrequency: number;
  prompt: string;
  tone: "warm" | "cooling" | "repair" | "celebrate";
}

export const suggestionTemplates: SuggestionTemplate[] = [
  {
    id: "photo-memory",
    minRecencyDays: 7,
    maxRecencyDays: 45,
    minEmotion: -0.2,
    maxEmotion: 0.5,
    minFrequency: 0,
    maxFrequency: 3,
    prompt: "지난번에 웃었던 사진 1장을 보내보는 건 어때요?",
    tone: "repair",
  },
  {
    id: "voice-note",
    minRecencyDays: 10,
    maxRecencyDays: 90,
    minEmotion: -1,
    maxEmotion: 0.2,
    minFrequency: 0,
    maxFrequency: 2,
    prompt: "짧은 음성 메시지로 안부를 전해보세요.",
    tone: "repair",
  },
  {
    id: "celebrate-win",
    minRecencyDays: 0,
    maxRecencyDays: 21,
    minEmotion: 0.3,
    maxEmotion: 1,
    minFrequency: 1,
    maxFrequency: 6,
    prompt: "최근에 고마웠던 일을 한 줄로 적어 보내보세요.",
    tone: "celebrate",
  },
  {
    id: "coffee-catchup",
    minRecencyDays: 21,
    maxRecencyDays: 120,
    minEmotion: -0.3,
    maxEmotion: 0.6,
    minFrequency: 0,
    maxFrequency: 2,
    prompt: "다음 주에 짧은 커피챗을 제안해보면 어떨까요?",
    tone: "cooling",
  },
  {
    id: "gratitude",
    minRecencyDays: 0,
    maxRecencyDays: 14,
    minEmotion: 0,
    maxEmotion: 1,
    minFrequency: 0,
    maxFrequency: 4,
    prompt: "최근에 느꼈던 감사 한 줄을 전해보세요.",
    tone: "warm",
  },
  {
    id: "light-touch",
    minRecencyDays: 30,
    maxRecencyDays: 180,
    minEmotion: -1,
    maxEmotion: 0.4,
    minFrequency: 0,
    maxFrequency: 1,
    prompt: "요즘 어떻게 지내는지 가볍게 안부를 물어보세요.",
    tone: "repair",
  },
];
