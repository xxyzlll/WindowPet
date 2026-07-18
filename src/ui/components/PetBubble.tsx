import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePetBubbleStore, IPetBubbleItem } from '../../hooks/usePetBubbleStore';
import { useIgnoreCursorStore } from '../../hooks/useIgnoreCursorStore';
import { calculateBubblePosition } from '../../utils/bubblePosition';
import './PetBubble.css';

interface IPetBubbleProps {
    petId: string;
    petX: number;
    petY: number;
    petWidth: number;
    petHeight: number;
}

function PetBubble({ petId, petX, petY, petWidth, petHeight }: IPetBubbleProps) {
    const { currentBubble, removeBubble } = usePetBubbleStore();
    const [isVisible, setIsVisible] = useState(false);
    const [bubbleSize, setBubbleSize] = useState({ width: 200, height: 80 });
    const bubbleRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const { request, release } = useIgnoreCursorStore();

    const isForThisPet = currentBubble?.petId === petId;

    useEffect(() => {
        if (isForThisPet) {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
        }
    }, [isForThisPet]);

    useEffect(() => {
        if (isForThisPet && isVisible && bubbleRef.current) {
            const rect = bubbleRef.current.getBoundingClientRect();
            setBubbleSize({ width: rect.width, height: rect.height });
        }
    }, [isForThisPet, isVisible, currentBubble?.content]);

    useEffect(() => {
        if (!isForThisPet || !currentBubble) return;

        if (currentBubble.type === 'tip' && currentBubble.duration !== 0) {
            const duration = currentBubble.duration ?? 3000;
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isForThisPet, currentBubble]);

    useEffect(() => {
        if (isForThisPet && isVisible && currentBubble) {
            request(`bubble-${currentBubble.id}`);
            return () => {
                release(`bubble-${currentBubble.id}`);
            };
        }
    }, [isForThisPet, isVisible, currentBubble, request, release]);

    const handleClose = useCallback(() => {
        if (currentBubble) {
            setIsVisible(false);
            setTimeout(() => {
                removeBubble(currentBubble.id);
            }, 200);
        }
    }, [currentBubble, removeBubble]);

    const handleButtonClick = useCallback((onClick: () => void) => {
        onClick();
        handleClose();
    }, [handleClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget && currentBubble?.type !== 'confirm') {
            handleClose();
        }
    }, [currentBubble, handleClose]);

    if (!isForThisPet || !currentBubble) return null;

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
        if (pos.placement === 'top') {
            bubbleStyle.top = `${pos.top}px`;
        } else {
            bubbleStyle.top = `${pos.top}px`;
        }
    } else {
        bubbleStyle.top = `${pos.top}px`;
        bubbleStyle.transform = 'translateY(-50%)';
        if (pos.placement === 'left') {
            bubbleStyle.left = `${pos.left}px`;
        } else {
            bubbleStyle.left = `${pos.left}px`;
        }
    }

    return (
        <div
            className={`pet-bubble-container ${isVisible ? 'visible' : ''}`}
            style={bubbleStyle}
            onClick={handleBackdropClick}
        >
            <div
                ref={bubbleRef}
                className={`pet-bubble pet-bubble-${currentBubble.type} arrow-${pos.arrowPlacement}`}
            >
                <div className="pet-bubble-content">
                    {currentBubble.content}
                </div>

                {currentBubble.buttons && currentBubble.buttons.length > 0 && (
                    <div className="pet-bubble-buttons">
                        {currentBubble.buttons.map((btn, index) => (
                            <button
                                key={index}
                                className={`pet-bubble-btn pet-bubble-btn-${btn.type || 'primary'}`}
                                onClick={() => handleButtonClick(btn.onClick)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="pet-bubble-arrow"></div>
            </div>
        </div>
    );
}

export default PetBubble;
