package com.httmdt.orientalherbs.service.chatbot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.types.Content;
import com.google.genai.types.FunctionCall;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final com.httmdt.orientalherbs.service.ai.GeminiClientManager geminiClientManager;
    private final ChatbotToolService chatbotToolService;
    private final ObjectMapper objectMapper;
    private final com.google.genai.types.GenerateContentConfig geminiGenerationConfig;

    @Value("${gemini.model}")
    private String modelName;

    @Value("${gemini.max-history-per-session:20}")
    private int maxHistoryPerSession;

    @Value("${gemini.chatbot-max-sessions:500}")
    private int maxSessions;

    @Value("${gemini.chatbot-session-ttl-minutes:30}")
    private int sessionTtlMinutes;

    private final ConcurrentHashMap<String, SessionData> sessions = new ConcurrentHashMap<>();

    private static final int MAX_FUNCTION_CALL_DEPTH = 3;

    private static class SessionData {
        final List<Content> history = new ArrayList<>();
        volatile long lastAccess;
        SessionData() { this.lastAccess = Instant.now().toEpochMilli(); }
        void touch() { this.lastAccess = Instant.now().toEpochMilli(); }
    }

    public void chat(String sessionId, String userMessage, OutputStreamWriter writer) throws IOException {
        if (!geminiClientManager.isEnabled()) {
            writeChunk(writer, Map.of("error", "Chatbot AI đang tạm tắt. Vui lòng thử lại sau."));
            writeChunk(writer, Map.of("done", true));
            return;
        }

        String actualSessionId = (sessionId == null || sessionId.isBlank())
            ? UUID.randomUUID().toString()
            : sessionId;

        SessionData sessionData = getOrCreateSession(actualSessionId);

        Content userContent = Content.builder().role("user").parts(List.of(Part.fromText(userMessage))).build();

        List<Content> fullHistory = new ArrayList<>(sessionData.history);
        fullHistory.add(userContent);

        try {
            GenerateContentResponse response = callGeminiWithRetry(fullHistory, 0);
            processResponse(response, sessionData, userContent, writer, fullHistory, 0);
        } catch (Exception e) {
            writeChunk(writer, Map.of("error", "Đã xảy ra lỗi: " + e.getMessage()));
            writeChunk(writer, Map.of("done", true));
        }

        trimHistory(sessionData.history);
        sessionData.touch();
    }

    public void chatSync(String sessionId, String userMessage, StringBuilder buffer) throws IOException {
        chatSync(sessionId, userMessage, buffer, null);
    }

    public void chatSync(String sessionId, String userMessage, StringBuilder buffer, Long userId) throws IOException {
        if (!geminiClientManager.isEnabled()) {
            buffer.append("Chatbot AI đang tạm tắt. Vui lòng thử lại sau.");
            return;
        }

        String actualSessionId = (sessionId == null || sessionId.isBlank())
            ? UUID.randomUUID().toString()
            : sessionId;

        SessionData sessionData = getOrCreateSession(actualSessionId);

        if (userId != null) {
            chatbotToolService.setCurrentUserId(userId);
        }

        Content userContent = Content.builder().role("user").parts(List.of(Part.fromText(userMessage))).build();
        List<Content> fullHistory = new ArrayList<>(sessionData.history);
        fullHistory.add(userContent);

        try {
            GenerateContentResponse response = callGeminiWithRetry(fullHistory, 0);
            processResponseSync(response, sessionData, userContent, buffer, fullHistory, 0);
        } catch (Exception e) {
            buffer.append("Đã xảy ra lỗi: ").append(e.getMessage());
        }

        trimHistory(sessionData.history);
        sessionData.touch();
    }

    private SessionData getOrCreateSession(String sessionId) {
        if (sessions.size() >= maxSessions) {
            evictOldestSession();
        }
        return sessions.computeIfAbsent(sessionId, k -> new SessionData());
    }

    private void evictOldestSession() {
        long oldestTime = Long.MAX_VALUE;
        String oldestKey = null;
        for (Map.Entry<String, SessionData> entry : sessions.entrySet()) {
            if (entry.getValue().lastAccess < oldestTime) {
                oldestTime = entry.getValue().lastAccess;
                oldestKey = entry.getKey();
            }
        }
        if (oldestKey != null) {
            sessions.remove(oldestKey);
            log.debug("Evicted oldest session: {}", oldestKey);
        }
    }

    @Scheduled(fixedRate = 300000)
    public void cleanupExpiredSessions() {
        if (sessions.isEmpty()) return;
        long cutoff = Instant.now().toEpochMilli() - (sessionTtlMinutes * 60 * 1000L);
        int before = sessions.size();
        Iterator<SessionData> it = sessions.values().iterator();
        while (it.hasNext()) {
            if (it.next().lastAccess < cutoff) {
                it.remove();
            }
        }
        int removed = before - sessions.size();
        if (removed > 0) {
            log.info("Cleaned up {} expired chatbot sessions (TTL={}min). Remaining: {}",
                removed, sessionTtlMinutes, sessions.size());
        }
    }

    private GenerateContentResponse callGeminiWithRetry(List<Content> contents, int depth) throws Exception {
        return geminiClientManager.generateContentWithRotation(modelName, contents, geminiGenerationConfig);
    }

    private void processResponse(GenerateContentResponse response, SessionData sessionData,
            Content userContent, OutputStreamWriter writer, List<Content> fullHistory, int depth) throws IOException {

        if (response == null) {
            writeChunk(writer, Map.of("done", true));
            return;
        }

        if (depth >= MAX_FUNCTION_CALL_DEPTH) {
            log.warn("Max function call depth ({}) reached in session. Stopping.", MAX_FUNCTION_CALL_DEPTH);
            writeChunk(writer, Map.of("error", "Đã đạt giới hạn độ sâu xử lý. Vui lòng bắt đầu cuộc trò chuyện mới."));
            writeChunk(writer, Map.of("done", true));
            return;
        }

        var functionCalls = response.functionCalls();
        if (functionCalls != null && !functionCalls.isEmpty()) {
            var candsOpt = response.candidates();
            if (candsOpt != null && candsOpt.isPresent() && !candsOpt.get().isEmpty()) {
                var contentOpt = candsOpt.get().get(0).content();
                if (contentOpt != null && contentOpt.isPresent()) {
                    fullHistory.add(contentOpt.get());
                }
            }
            List<Part> responseParts = new ArrayList<>();
            for (FunctionCall fc : functionCalls) {
                String functionName = fc.name().orElse("");
                var argsOpt = fc.args();
                Object rawArgs = argsOpt.isPresent() ? argsOpt.get() : null;
                String toolResult = chatbotToolService.executeFunction(functionName, rawArgs);
                Map<String, Object> responseMap;
                try {
                    responseMap = objectMapper.readValue(toolResult, Map.class);
                } catch (Exception e) {
                    responseMap = Map.of("result", toolResult);
                }
                responseParts.add(Part.fromFunctionResponse(functionName, responseMap));
            }
            Content toolResponseContent = Content.builder().role("function").parts(responseParts).build();
            fullHistory.add(toolResponseContent);
            try {
                GenerateContentResponse nextResponse = callGeminiWithRetry(fullHistory, depth);
                processResponse(nextResponse, sessionData, userContent, writer, fullHistory, depth + 1);
            } catch (Exception e) {
                writeChunk(writer, Map.of("error", "Lỗi khi xử lý: " + e.getMessage()));
                writeChunk(writer, Map.of("done", true));
            }
            return;
        }

        String text = response.text();
        if (text != null && !text.isEmpty()) {
            writeChunk(writer, Map.of("text", text));
            addAssistantToHistory(sessionData.history, userContent, text);
        }

        writeChunk(writer, Map.of("done", true));
    }

    // handleFunctionCall removed

    private void processResponseSync(GenerateContentResponse response, SessionData sessionData,
            Content userContent, StringBuilder buffer, List<Content> fullHistory, int depth) throws IOException {

        if (response == null) return;

        if (depth >= MAX_FUNCTION_CALL_DEPTH) {
            log.warn("Max function call depth ({}) reached in sync session. Stopping.", MAX_FUNCTION_CALL_DEPTH);
            buffer.append("Đã đạt giới hạn độ sâu xử lý. Vui lòng bắt đầu cuộc trò chuyện mới.");
            return;
        }

        var functionCalls = response.functionCalls();
        if (functionCalls != null && !functionCalls.isEmpty()) {
            var candsOpt = response.candidates();
            if (candsOpt != null && candsOpt.isPresent() && !candsOpt.get().isEmpty()) {
                var contentOpt = candsOpt.get().get(0).content();
                if (contentOpt != null && contentOpt.isPresent()) {
                    fullHistory.add(contentOpt.get());
                }
            }
            List<Part> responseParts = new ArrayList<>();
            for (FunctionCall fc : functionCalls) {
                String functionName = fc.name().orElse("");
                var argsOpt = fc.args();
                Object rawArgs = argsOpt.isPresent() ? argsOpt.get() : null;
                String toolResult = chatbotToolService.executeFunction(functionName, rawArgs);
                Map<String, Object> responseMap;
                try {
                    responseMap = objectMapper.readValue(toolResult, Map.class);
                } catch (Exception e) {
                    responseMap = Map.of("result", toolResult);
                }
                responseParts.add(Part.fromFunctionResponse(functionName, responseMap));
            }
            Content toolResponseContent = Content.builder().role("function").parts(responseParts).build();
            fullHistory.add(toolResponseContent);
            try {
                GenerateContentResponse nextResponse = callGeminiWithRetry(fullHistory, depth);
                processResponseSync(nextResponse, sessionData, userContent, buffer, fullHistory, depth + 1);
            } catch (Exception e) {
                buffer.append("Lỗi khi xử lý: ").append(e.getMessage());
            }
            return;
        }

        String text = response.text();
        if (text != null && !text.isEmpty()) {
            buffer.append(text);
            addAssistantToHistory(sessionData.history, userContent, text);
        }
    }

    // handleFunctionCallSync removed

    private void addAssistantToHistory(List<Content> history, Content userContent, String text) {
        if (text == null || text.isEmpty()) return;
        if (userContent == null) return;

        List<Content> newHistory = new ArrayList<>(history);
        newHistory.add(userContent);
        newHistory.add(Content.builder().role("model").parts(List.of(Part.fromText(text))).build());
        history.clear();
        history.addAll(newHistory);
    }

    private void trimHistory(List<Content> history) {
        if (history.size() > maxHistoryPerSession) {
            List<Content> trimmed = new ArrayList<>(history.subList(
                history.size() - maxHistoryPerSession, history.size()));
            history.clear();
            history.addAll(trimmed);
        }
    }

    private void writeChunk(OutputStreamWriter writer, Map<String, Object> data) throws IOException {
        writer.write("data: ");
        writer.write(objectMapper.writeValueAsString(data));
        writer.write("\n\n");
        writer.flush();
    }

    public void clearSession(String sessionId) {
        sessions.remove(sessionId);
        log.info("Session cleared: {}", sessionId);
    }

    public int getActiveSessionCount() {
        return sessions.size();
    }
}
