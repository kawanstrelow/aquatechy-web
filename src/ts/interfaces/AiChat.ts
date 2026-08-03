export type AiConversation = {
  id: string;
  userId: string;
  companyId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type AiEntityType =
  | 'client'
  | 'pool'
  | 'service'
  | 'assignment'
  | 'invoice'
  | 'estimate'
  | 'request'
  | 'product'
  | 'shopping_item'
  | 'user'
  | 'company';

export type AiEntity = {
  type: AiEntityType;
  id: string;
  label: string;
};

export type AiMessage = {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  toolCalls: unknown | null;
  toolCallId: string | null;
  toolName: string | null;
  entities: AiEntity[] | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  pendingAction: unknown | null;
  createdAt: string;
};

export type CreateAiConversationRequest = {
  title?: string;
  companyId?: string;
};

export type CreateAiConversationResponse = {
  conversation: AiConversation;
};

export type ListAiConversationsResponse = {
  conversations: AiConversation[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
};

export type GetAiConversationResponse = {
  conversation: AiConversation;
  messages: AiMessage[];
};

export type SendAiMessageRequest = {
  content: string;
};

export type SendAiMessageResponse = {
  message: AiMessage;
  entities: AiEntity[];
};

export type ListAiMessagesResponse = {
  messages: AiMessage[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
};
