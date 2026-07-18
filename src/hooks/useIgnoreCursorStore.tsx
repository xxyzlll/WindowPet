import { create } from "zustand";
import { appWindow } from "@tauri-apps/api/window";

interface IIgnoreCursorState {
    tokens: Set<string>;
    request: (token: string) => void;
    release: (token: string) => void;
}

let initialized = false;

export const useIgnoreCursorStore = create<IIgnoreCursorState>()((set, get) => ({
    tokens: new Set(),

    request: (token) => {
        set((state) => {
            const newTokens = new Set(state.tokens);
            newTokens.add(token);
            return { tokens: newTokens };
        });
    },

    release: (token) => {
        set((state) => {
            const newTokens = new Set(state.tokens);
            newTokens.delete(token);
            return { tokens: newTokens };
        });
    },
}));

useIgnoreCursorStore.subscribe((state) => {
    if (state.tokens.size === 0) {
        appWindow.setIgnoreCursorEvents(true);
    } else {
        appWindow.setIgnoreCursorEvents(false);
    }
});
