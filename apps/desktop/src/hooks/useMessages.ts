import { useCallback, useState } from "react";

export function useMessages() {
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = useCallback((message: unknown) => {
    setMessages((prev) => [
      typeof message === "string" ? message : JSON.stringify(message),
      ...prev
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages
  };
}