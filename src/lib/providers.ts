export type ProviderId = 'groq' | 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'mistral' | 'openrouter' | 'omniroute';

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  logo: string;
  endpoint: string;
  keyEnv: string;
  keyPrefix: string;
  keyPlaceholder: string;
  apiKeyDocs: string;
  baseUrl: string;
  apiPath: string;
  authHeader: string;
  format: 'openai' | 'anthropic' | 'gemini';
  autoSelectModel: boolean;
  models: string[];
  description: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'groq',
    name: 'Groq',
    logo: 'Lightning',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    keyEnv: 'GROQ_API_KEY',
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    apiKeyDocs: 'https://console.groq.com/keys',
    baseUrl: 'https://api.groq.com',
    apiPath: '/openai/v1/chat/completions',
    authHeader: 'Bearer',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'Ultra-fast inference with Llama, Qwen, and more',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: 'Blue Circle',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyEnv: 'OPENAI_API_KEY',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    apiKeyDocs: 'https://platform.openai.com/api-keys',
    baseUrl: 'https://api.openai.com',
    apiPath: '/v1/chat/completions',
    authHeader: 'Bearer',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: 'Fire',
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyEnv: 'ANTHROPIC_API_KEY',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    apiKeyDocs: 'https://console.anthropic.com/settings/keys',
    baseUrl: 'https://api.anthropic.com',
    apiPath: '/v1/messages',
    authHeader: 'x-api-key',
    format: 'anthropic',
    autoSelectModel: true,
    models: ['auto'],
    description: 'Claude 3.5 Sonnet, Claude 3 Opus',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: 'Green Circle',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    keyEnv: 'GEMINI_API_KEY',
    keyPrefix: '',
    keyPlaceholder: 'AIza...',
    apiKeyDocs: 'https://aistudio.google.com/app/apikey',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiPath: '/v1beta/openai/chat/completions',
    authHeader: 'ApiKey',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'Gemini 2.0 Flash, Gemini 2.0 Pro',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: 'Light Bulb',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    keyEnv: 'DEEPSEEK_API_KEY',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    apiKeyDocs: 'https://platform.deepseek.com/api_keys',
    baseUrl: 'https://api.deepseek.com',
    apiPath: '/v1/chat/completions',
    authHeader: 'Bearer',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'DeepSeek V3, DeepSeek R1 reasoning',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    logo: 'Red Circle',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    keyEnv: 'MISTRAL_API_KEY',
    keyPrefix: 'mistral-',
    keyPlaceholder: 'mistral-...',
    apiKeyDocs: 'https://console.mistral.ai/api-keys',
    baseUrl: 'https://api.mistral.ai',
    apiPath: '/v1/chat/completions',
    authHeader: 'Bearer',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'Mistral Large, Mistral Nemo',
  },
  {
    id: 'omniroute',
    name: 'Omniroute',
    logo: 'Arrows',
    endpoint: 'https://api.omniroute.ai/v1/chat/completions',
    keyEnv: 'OMNIRoute_API_KEY',
    keyPrefix: 'or-',
    keyPlaceholder: 'or-...',
    apiKeyDocs: 'https://omniroute.ai/dashboard',
    baseUrl: 'https://api.omniroute.ai',
    apiPath: '/v1/chat/completions',
    authHeader: 'Bearer',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'Unified routing across multiple providers',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: 'Globe',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    keyEnv: 'OPENROUTER_API_KEY',
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-...',
    apiKeyDocs: 'https://openrouter.ai/keys',
    baseUrl: 'https://openrouter.ai',
    apiPath: '/api/v1/chat/completions',
    authHeader: 'Bearer',
    format: 'openai',
    autoSelectModel: true,
    models: ['auto'],
    description: 'All models from 100+ providers in one API',
  },
];

export const DEFAULT_PROVIDER = 'groq';
