import { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import Pets from "./scenes/Pets";
import { useSettingStore } from "./hooks/useSettingStore";
import { useAIChatStore } from "./hooks/useAIChatStore";
import { usePetBubbleStore } from "./hooks/usePetBubbleStore";
import { useContextMenuStore } from "./hooks/useContextMenuStore";
import { useDesktopStorage } from "./hooks/useDesktopStorage";
import { appWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import AIChatBubble from "./ui/components/AIChatBubble";
import PetBubble from "./ui/components/PetBubble";
import PetContextMenu from "./ui/components/PetContextMenu";

interface IPetBubblePosition {
    petId: string;
    petX: number;
    petY: number;
    petWidth: number;
    petHeight: number;
}

function PhaserWrapper() {
    const phaserDom = useRef<HTMLDivElement>(null);
    const { pets } = useSettingStore();
    const { isOpen: aiChatOpen, petId: aiChatPetId, petName, petX, petY, petWidth, petHeight, closeChat } = useAIChatStore();
    const { currentBubble } = usePetBubbleStore();
    const { openMenu } = useContextMenuStore();
    const { t } = useTranslation();
    const { showStorageSelect, undoLastStorage } = useDesktopStorage();

    const [screenWidth, setScreenWidth] = useState(window.screen.width);
    const [screenHeight, setScreenHeight] = useState(window.screen.height);
    const [bubblePosition, setBubblePosition] = useState<IPetBubblePosition | null>(null);

    const handleRightClick = useCallback((e: Event) => {
        const customEvent = e as CustomEvent;
        const { petId, petName: name, petX: px, petY: py, petWidth: pw, petHeight: ph, screenX, screenY } = customEvent.detail;

        console.log('[PhaserWrapper] handleRightClick called, petId:', petId, 'screenX:', screenX, 'screenY:', screenY);

        const petInfo = { petId, petName: name, petX: px, petY: py, petWidth: pw, petHeight: ph };

        openMenu(screenX, screenY, petInfo, [
            {
                key: 'ai-chat',
                label: t('AI Chat'),
                onClick: () => {
                    console.log('[PhaserWrapper] AI Chat clicked');
                    useAIChatStore.getState().openChat(petId, name, px, py, pw, ph);
                },
            },
            {
                key: 'tidy-all',
                label: t('desktopStorage:Tidy All'),
                onClick: () => {
                    console.log('[PhaserWrapper] Tidy All clicked');
                    showStorageSelect(petId);
                },
            },
            {
                key: 'undo-last',
                label: t('desktopStorage:Undo Last'),
                onClick: () => {
                    console.log('[PhaserWrapper] Undo Last clicked');
                    undoLastStorage(petId);
                },
            },
        ]);
    }, [t, openMenu, showStorageSelect, undoLastStorage]);

    const handleBubbleUpdate = useCallback((e: Event) => {
        const customEvent = e as CustomEvent;
        const { petId: id, petX: px, petY: py, petWidth: pw, petHeight: ph } = customEvent.detail;
        if (currentBubble?.petId === id) {
            setBubblePosition({
                petId: id,
                petX: px,
                petY: py,
                petWidth: pw,
                petHeight: ph,
            });
        }
    }, [currentBubble]);

    useEffect(() => {
        if (!currentBubble) {
            setBubblePosition(null);
        }
    }, [currentBubble]);

    useEffect(() => {
        if (!phaserDom.current) return;

        const handleResize = () => {
            setScreenWidth(window.screen.width);
            setScreenHeight(window.screen.height);
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("pet-right-click", handleRightClick);
        window.addEventListener("pet-bubble-update", handleBubbleUpdate);

        // ensure that if component remount user will still be able to touch their screen
        appWindow.setIgnoreCursorEvents(true);

        const phaserConfig: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: phaserDom.current,
            backgroundColor: '#ffffff0',
            transparent: true,
            roundPixels: true,
            antialias: true,
            scale: {
                mode: Phaser.Scale.ScaleModes.RESIZE,
                width: screenWidth,
                height: screenHeight,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                    gravity: { y: 200, x: 0},
                },
            },
            fps: {
                target: 30,
                min: 30,
                smoothStep: true,
            },
            scene: [Pets],
            audio: {
                noAudio: true,
            },
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('spriteConfig', pets);
                }
            }
        }

        const game = new Phaser.Game(phaserConfig);

        return () => {
            game.destroy(true);
            if (phaserDom.current !== null) phaserDom.current.innerHTML = '';
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("pet-right-click", handleRightClick);
            window.removeEventListener("pet-bubble-update", handleBubbleUpdate);
        }

    }, [pets, screenWidth, screenHeight, handleRightClick, handleBubbleUpdate]);

    const showBubble = currentBubble && bubblePosition && currentBubble.petId === bubblePosition.petId;

    return (
        <>
            <div ref={phaserDom} />
            <PetContextMenu />
            {aiChatOpen && (
                <AIChatBubble
                    petId={aiChatPetId}
                    petName={petName}
                    petX={petX}
                    petY={petY}
                    petWidth={petWidth}
                    petHeight={petHeight}
                    onClose={closeChat}
                />
            )}
            {showBubble && bubblePosition && (
                <PetBubble
                    petId={bubblePosition.petId}
                    petX={bubblePosition.petX}
                    petY={bubblePosition.petY}
                    petWidth={bubblePosition.petWidth}
                    petHeight={bubblePosition.petHeight}
                />
            )}
        </>
    )
}

export default PhaserWrapper;
