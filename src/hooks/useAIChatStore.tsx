import { create } from "zustand";

export interface IAIChatState {
    isOpen: boolean;
    petId: string;
    petName: string;
    petX: number;
    petY: number;
    petWidth: number;
    petHeight: number;
    openChat: (petId: string, petName: string, petX: number, petY: number, petWidth: number, petHeight: number) => void;
    closeChat: () => void;
    updatePetPosition: (petX: number, petY: number) => void;
}

export const useAIChatStore = create<IAIChatState>()((set, get) => ({
    isOpen: false,
    petId: '',
    petName: '',
    petX: 0,
    petY: 0,
    petWidth: 0,
    petHeight: 0,
    openChat: (petId, petName, petX, petY, petWidth, petHeight) => {
        set({
            isOpen: true,
            petId,
            petName,
            petX,
            petY,
            petWidth,
            petHeight,
        });
    },
    closeChat: () => {
        set({ isOpen: false });
    },
    updatePetPosition: (petX, petY) => {
        const state = get();
        if (state.isOpen) {
            set({ petX, petY });
        }
    },
}));
