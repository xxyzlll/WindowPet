import { create } from "zustand";

export interface IContextMenuItem {
    key: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

export interface IPetInfo {
    petId: string;
    petName: string;
    petX: number;
    petY: number;
    petWidth: number;
    petHeight: number;
}

interface IContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    pet: IPetInfo | null;
    items: IContextMenuItem[];
    openMenu: (x: number, y: number, pet: IPetInfo, items: IContextMenuItem[]) => void;
    closeMenu: () => void;
}

export const useContextMenuStore = create<IContextMenuState>()((set) => ({
    isOpen: false,
    x: 0,
    y: 0,
    pet: null,
    items: [],

    openMenu: (x, y, pet, items) => {
        set({ isOpen: true, x, y, pet, items });
    },

    closeMenu: () => {
        set({ isOpen: false, items: [], pet: null });
    },
}));
