export interface ChatbotUI {
  theme: string;
  primaryColor: string;
  botColor: string;
  welcomeMessage: string;
  logoUrl: string;
  position: string;
  customCss: string;
  displayName: string;
  messagePlaceholder: string;
  suggestedMessages: string[];
  botMessage: string;
}

export interface ChatbotModelConfig {
  topP: number;
  frequencyPenalty: number;
  topK: number;
  temperature: number;
  maxTokens: number;
}

export interface ChatbotBehaviorPolicies {
  bannedTopics: string[];
  requiredDisclaimers: string[];
  politenessLevel: string;
}

export interface ChatbotConfig {
  model: ChatbotModelConfig;
  behaviorPolicies: ChatbotBehaviorPolicies;
  tools: any[];
  escalationThreshold: number;
  systemPrompt: string;
}

export interface ChatbotRouting {
  escalationEnabled: boolean;
  strategy: string;
  defaultPriority: string;
}

export interface ChatbotWidget {
  autoShowDelay: number;
  enabled: boolean;
  allowAnonymous: boolean;
  allowedOrigins: string[];
  aiChatEnabled: boolean;
  keyPermissions: string[];
  keyUsageCount: number;
  widgetKey: string;
  keyExpiry: string;
  lastKeyGenerated: string;
}

export interface ChatbotPopupMessage {
  message: string;
  status: boolean;
}

export interface ChatbotFallbackResponse {
  message: string;
  status: boolean;
}

export interface ChatbotWorkingHours {
  schedule: any[];
}

export interface ChatbotSettings {
  popupMessage: ChatbotPopupMessage;
  fallbackResponse: ChatbotFallbackResponse;
  workingHours: ChatbotWorkingHours;
  aiChat: boolean;
  collectFeedback: boolean;
  allowRegenerate: boolean;
}

export interface ChatbotDefaults {
  language: string;
}

export interface Chatbot {
  _id: string;
  tenantId: string;
  name: string;
  key: string;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  ui: ChatbotUI;
  config: ChatbotConfig;
  routing: ChatbotRouting;
  widget: ChatbotWidget;
  settings: ChatbotSettings;
  defaults: ChatbotDefaults;
}

export interface ChatbotApiResponse {
  success: boolean;
  data: Chatbot;
}
