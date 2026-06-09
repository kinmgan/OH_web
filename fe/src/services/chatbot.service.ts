// src/services/chatbot.service.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface ChatStreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function sendChatMessage(
  message: string,
  sessionId: string | null,
  callbacks: ChatStreamCallbacks
): Promise<void> {
  const { onChunk, onDone, onError } = callbacks;

  try {
    let token = null;
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(^|;)\s*accessToken\s*=\s*([^;]+)/);
      token = match ? match[2] : null;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/public/chatbot/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      onError('Lỗi kết nối server');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Không nhận được stream');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const match = line.match(/^data:\s*(.+)$/);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            if (data.text) onChunk(data.text);
            if (data.done) {
              onDone();
              return;
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    }
  } catch {
    onError('Không thể kết nối đến chatbot');
  }
}

export async function clearChatSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/public/chatbot/session/${sessionId}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
}
