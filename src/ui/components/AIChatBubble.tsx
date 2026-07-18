import { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useSettingStore } from '../../hooks/useSettingStore';
import { useIgnoreCursorStore } from '../../hooks/useIgnoreCursorStore';
import { useTranslation } from 'react-i18next';
import { calculateBubblePosition } from '../../utils/bubblePosition';
import './AIChatBubble.css';

interface IAIChatBubbleProps {
    petId: string;
    petName: string;
    petX: number;
    petY: number;
    petWidth: number;
    petHeight: number;
    onClose: () => void;
}

function AIChatBubble({ petId, petName, petX, petY, petWidth, petHeight, onClose }: IAIChatBubbleProps) {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [reply, setReply] = useState('');
    const [showInput, setShowInput] = useState(true);
    const [bubbleSize, setBubbleSize] = useState({ width: 280, height: 120 });
    const inputRef = useRef<HTMLInputElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const { deepseekApiKey, deepseekBaseUrl, deepseekModel } = useSettingStore();
    const { request, release } = useIgnoreCursorStore();

    useEffect(() => {
        request('ai-chat');
        return () => {
            release('ai-chat');
        };
    }, [request, release]);

    useEffect(() => {
        if (showInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showInput]);

    useEffect(() => {
        if (bubbleRef.current) {
            const rect = bubbleRef.current.getBoundingClientRect();
            setBubbleSize({ width: rect.width, height: rect.height });
        }
    }, [showInput, reply]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || isLoading) return;

        if (!deepseekApiKey) {
            setReply(t('Please configure your API key in the settings first.'));
            setShowInput(false);
            return;
        }

        setIsLoading(true);
        setReply('');
        setShowInput(false);

        const systemPrompt = t('AI System Prompt', { petName });

        try {
            const response: string = await invoke('chat_with_ai', {
                apiKey: deepseekApiKey,
                baseUrl: deepseekBaseUrl,
                model: deepseekModel,
                message: inputValue.trim(),
                systemPrompt,
                petName,
            });
            setReply(response);
        } catch (err: any) {
            setReply(`Error: ${err}`);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, deepseekApiKey, deepseekBaseUrl, deepseekModel, t, petName]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleBack = () => {
        setShowInput(true);
        setReply('');
        setInputValue('');
    };

    const pos = calculateBubblePosition(
        petX,
        petY,
        petWidth,
        petHeight,
        bubbleSize.width,
        bubbleSize.height,
        window.innerWidth,
        window.innerHeight,
    );

    const bubbleStyle: React.CSSProperties = {};
    if (pos.placement === 'top' || pos.placement === 'bottom') {
        bubbleStyle.left = `${pos.left}px`;
        bubbleStyle.transform = 'translateX(-50%)';
        bubbleStyle.top = `${pos.top}px`;
    } else {
        bubbleStyle.top = `${pos.top}px`;
        bubbleStyle.transform = 'translateY(-50%)';
        bubbleStyle.left = `${pos.left}px`;
    }

    return (
        <div
            className="ai-chat-container"
            style={bubbleStyle}
        >
            <div
                ref={bubbleRef}
                className={`ai-chat-bubble-wrapper arrow-${pos.arrowPlacement}`}
            >
                {showInput ? (
                    <div className="ai-chat-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            className="ai-chat-input"
                            placeholder={t("Ask me anything...")}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            className="ai-chat-send-btn"
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                        >
                            {t("Send")}
                        </button>
                        <button
                            className="ai-chat-close-btn"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="ai-chat-reply-container">
                        <div className="ai-chat-reply-content">
                            {isLoading ? (
                                <div className="ai-chat-loading">
                                    <span className="ai-chat-dot"></span>
                                    <span className="ai-chat-dot"></span>
                                    <span className="ai-chat-dot"></span>
                                </div>
                            ) : (
                                reply
                            )}
                        </div>
                        <div className="ai-chat-reply-actions">
                            <button
                                className="ai-chat-back-btn"
                                onClick={handleBack}
                            >
                                {t("Ask again")}
                            </button>
                            <button
                                className="ai-chat-close-btn-small"
                                onClick={onClose}
                            >
                                {t("Close")}
                            </button>
                        </div>
                    </div>
                )}
                <div className="ai-chat-bubble-arrow"></div>
            </div>
        </div>
    );
}

export default AIChatBubble;
