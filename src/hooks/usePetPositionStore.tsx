import { create } from "zustand";

export interface IPetPosition {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface IPetPositionState {
    petPositions: Map<string, IPetPosition>;
    updatePetPosition: (id: string, x: number, y: number, width: number, height: number) => void;
    removePetPosition: (id: string) => void;
    getPetPosition: (id: string) => IPetPosition | undefined;
}

export const usePetPositionStore = create<IPetPositionState>()((set, get) => ({
    petPositions: new Map(),

    updatePetPosition: (id, x, y, width, height) => {
        set((state) => {
            const newMap = new Map(state.petPositions);
            newMap.set(id, { id, x, y, width, height });
            return { petPositions: newMap };
        });
    },

    removePetPosition: (id) => {
        set((state) => {
            const newMap = new Map(state.petPositions);
            newMap.delete(id);
            return { petPositions: newMap };
        });
    },

    getPetPosition: (id) => {
        return get().petPositions.get(id);
    },
}));
