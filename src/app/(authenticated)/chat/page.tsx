'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { History } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/components/ui/use-toast';
import { useCreateConversation } from '@/hooks/react-query/ai/useCreateConversation';
import { useDeleteConversation } from '@/hooks/react-query/ai/useDeleteConversation';
import useGetConversation from '@/hooks/react-query/ai/useGetConversation';
import useGetConversations from '@/hooks/react-query/ai/useGetConversations';
import { useSendMessage } from '@/hooks/react-query/ai/useSendMessage';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { AiMessage } from '@/ts/interfaces/AiChat';
import { canAccessAiChat, getManagementCompanies } from '@/utils/aiChatAccess';

import { BetaBadge, ChatBetaNotice } from './components/ChatBetaNotice';
import { ChatComposer } from './components/ChatComposer';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatThread } from './components/ChatThread';

function visibleChatMessages(messages: AiMessage[]) {
  return messages.filter((m) => m.role === 'user' || m.role === 'assistant');
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: companies = [], isLoading: isLoadingCompanies, isSuccess: companiesLoaded } = useGetCompanies();
  const managementCompanies = useMemo(() => getManagementCompanies(companies), [companies]);

  // Backend-issued conversation id only (from POST /ai/conversations or URL/history)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => searchParams.get('conversationId')
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingUserContent, setPendingUserContent] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<AiMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const syncConversationIdToUrl = useCallback(
    (conversationId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (conversationId) {
        params.set('conversationId', conversationId);
      } else {
        params.delete('conversationId');
      }
      const qs = params.toString();
      router.replace(qs ? `/chat?${qs}` : '/chat', { scroll: false });
    },
    [router, searchParams]
  );

  const setConversationId = useCallback(
    (conversationId: string | null) => {
      setActiveConversationId(conversationId);
      syncConversationIdToUrl(conversationId);
    },
    [syncConversationIdToUrl]
  );

  // Keep state in sync when the user navigates via browser back/forward
  useEffect(() => {
    const fromUrl = searchParams.get('conversationId');
    setActiveConversationId((current) => (current === fromUrl ? current : fromUrl));
  }, [searchParams]);

  const { data: conversationsData, isLoading: isLoadingConversations } = useGetConversations(
    1,
    canAccessAiChat(companies)
  );

  // Avoid fetching a brand-new conversation mid-send (prevents 404 race clearing the backend id)
  const {
    data: conversationData,
    isError: isConversationError,
    error: conversationError
  } = useGetConversation(activeConversationId, { enabled: !isSending });

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (!companiesLoaded) return;
    if (!canAccessAiChat(companies)) {
      router.replace('/dashboard');
    }
  }, [companies, companiesLoaded, router]);

  useEffect(() => {
    if (!selectedCompanyId && managementCompanies[0]) {
      setSelectedCompanyId(managementCompanies[0].id);
    }
  }, [managementCompanies, selectedCompanyId]);

  useEffect(() => {
    if (!isConversationError || !activeConversationId || isSending) return;

    const status = (conversationError as AxiosError | undefined)?.response?.status;
    if (status === 404 || status === 403) {
      toast({
        duration: 3000,
        variant: 'error',
        title: 'Conversation unavailable',
        description: 'This chat was removed or you no longer have access.'
      });
      setConversationId(null);
      setThreadMessages([]);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    }
  }, [isConversationError, conversationError, activeConversationId, isSending, queryClient, setConversationId]);

  // Sync thread from server when opening a conversation (skip while a send is in flight).
  useEffect(() => {
    if (!conversationData || isSending) return;
    if (conversationData.conversation.id !== activeConversationId) return;

    const serverVisible = visibleChatMessages(conversationData.messages);
    setThreadMessages((prev) => (serverVisible.length >= prev.length ? serverVisible : prev));

    if (conversationData.conversation.companyId) {
      setSelectedCompanyId(conversationData.conversation.companyId);
    }
  }, [conversationData, isSending, activeConversationId]);

  const handleNewChat = () => {
    setConversationId(null);
    setThreadMessages([]);
    setPendingUserContent(null);
    setDraft('');
    setMobileHistoryOpen(false);
    if (managementCompanies[0]) {
      setSelectedCompanyId(managementCompanies[0].id);
    }
  };

  const handleSelectConversation = (id: string) => {
    // id comes from GET /ai/conversations list (backend ObjectId)
    setConversationId(id);
    setThreadMessages([]);
    setPendingUserContent(null);
    setMobileHistoryOpen(false);
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === selectedCompanyId) return;

    // Changing company while a thread is open starts a new chat with that company
    if (activeConversationId || threadMessages.length > 0) {
      setConversationId(null);
      setThreadMessages([]);
      setPendingUserContent(null);
    }
    setSelectedCompanyId(companyId);
  };

  const handleDelete = (id: string) => {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (activeConversationId === id) {
          handleNewChat();
        }
      }
    });
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    if (!selectedCompanyId) {
      toast({
        duration: 3000,
        variant: 'error',
        title: 'Select a company',
        description: 'Choose a company before starting a chat.'
      });
      return;
    }

    setIsSending(true);
    setPendingUserContent(content);
    setDraft('');

    try {
      // 1) Ensure we have a backend-issued conversation id
      let conversationId = activeConversationId;

      if (!conversationId) {
        const created = await createConversation.mutateAsync({ companyId: selectedCompanyId });
        conversationId = created?.conversation?.id ?? null;

        if (!conversationId) {
          throw new Error('Create conversation response did not include conversation.id');
        }

        // Store backend id in state + URL before messaging
        setConversationId(conversationId);
      }

      // 2) POST /ai/conversations/{conversationId}/messages  body: { content } only
      const response = await sendMessage.mutateAsync({ conversationId, content });

      const userMessage: AiMessage = {
        id: `optimistic-user-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        toolCalls: null,
        toolCallId: null,
        toolName: null,
        entities: null,
        usage: null,
        pendingAction: null,
        createdAt: new Date().toISOString()
      };

      // Append optimistic user bubble + assistant message from response.message
      setThreadMessages((prev) => [...prev, userMessage, response.message]);
      setPendingUserContent(null);

      await queryClient.invalidateQueries({ queryKey: ['ai-conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch {
      setDraft(content);
      setPendingUserContent(null);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingCompanies || !companiesLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canAccessAiChat(companies)) {
    return null;
  }

  const conversations = conversationsData?.conversations ?? [];

  const sidebarProps = {
    conversations,
    activeConversationId,
    isLoading: isLoadingConversations,
    isDeleting: deleteConversation.isPending,
    onNewChat: handleNewChat,
    onSelect: handleSelectConversation,
    onDelete: handleDelete
  };

  return (
    <div className="-m-2 flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-md border border-slate-200 bg-slate-50 lg:h-[calc(100vh-6.5rem)]">
      <ChatBetaNotice />

      <div className="hidden h-full lg:flex">
        <ChatSidebar {...sidebarProps} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <History className="h-4 w-4" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat history</SheetTitle>
              </SheetHeader>
              <ChatSidebar {...sidebarProps} />
            </SheetContent>
          </Sheet>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
            AI Chat
            <BetaBadge />
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleNewChat}>
            New
          </Button>
        </div>

        <ChatThread
          messages={threadMessages}
          isSending={isSending}
          pendingUserContent={pendingUserContent}
          onSuggestionClick={setDraft}
        />

        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          isSending={isSending}
          companies={managementCompanies}
          selectedCompanyId={selectedCompanyId}
          onCompanySelect={handleCompanySelect}
          companyLocked={Boolean(activeConversationId || threadMessages.length)}
        />
      </div>
    </div>
  );
}
