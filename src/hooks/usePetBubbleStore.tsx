import { create } from "zustand";

export type PetBubbleType = 'select' | 'tip' | 'confirm';

export interface IPetBubbleButton {
    label: string;
    type?: 'primary' | 'secondary' | 'danger';
    onClick: () => void;
}

export interface IPetBubbleItem {
    id: string;
    type: PetBubbleType;
    content: string;
    petId: string;
    buttons?: IPetBubbleButton[];
    duration?: number;
    placement?: 'top' | 'bottom';
}

interface IPetBubbleState {
    bubbles: IPetBubbleItem[];
    currentBubble: IPetBubbleItem | null;
    addBubble: (bubble: Omit<IPetBubbleItem, 'id'>) => string;
    removeBubble: (id: string) => void;
    showNext: () => void;
}

export const usePetBubbleStore = create<IPetBubbleState>()((set, get) => ({
    bubbles: [],
    currentBubble: null,

    addBubble: (bubble) => {
        const id = crypto.randomUUID();
        const newBubble = { ...bubble, id };

        set((state) => {
            const newBubbles = [...state.bubbles, newBubble];
            if (!state.currentBubble) {
                return {
                    bubbles: newBubbles,
                    currentBubble: newBubble,
                };
            }
            return { bubbles: newBubbles };
        });

        return id;
    },

    removeBubble: (id) => {
        set((state) => {
            const isCurrent = state.currentBubble?.id === id;
            const newBubbles = state.bubbles.filter((b) => b.id !== id);

            if (isCurrent) {
                const next = newBubbles[0] || null;
                return {
                    bubbles: next ? newBubbles.slice(1) : [],
                    currentBubble: next,
                };
            }

            return { bubbles: newBubbles };
        });
    },

    showNext: () => {
        const state = get();
        if (state.bubbles.length > 0) {
            const next = state.bubbles[0];
            set({
                bubbles: state.bubbles.slice(1),
                currentBubble: next,
            });
        } else {
            set({ currentBubble: null });
        }
    },
}));
