import { useEffect, useCallback, useState, useRef } from 'react';
import { useContextMenuStore } from '../../hooks/useContextMenuStore';
import { useIgnoreCursorStore } from '../../hooks/useIgnoreCursorStore';
import './PetContextMenu.css';

const MENU_WIDTH = 180;
const MENU_ITEM_HEIGHT = 36;

function PetContextMenu() {
    const { isOpen, x, y, items, closeMenu } = useContextMenuStore();
    const { request, release } = useIgnoreCursorStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState({ left: 0, top: 0 });

    useEffect(() => {
        if (isOpen && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let left = x;
            let top = y;

            if (left + rect.width > window.innerWidth - 10) {
                left = window.innerWidth - rect.width - 10;
            }
            if (left < 10) {
                left = 10;
            }
            if (top + rect.height > window.innerHeight - 10) {
                top = window.innerHeight - rect.height - 10;
            }
            if (top < 10) {
                top = 10;
            }

            setAdjustedPos({ left, top });
        }
    }, [isOpen, x, y, items.length]);

    useEffect(() => {
        if (isOpen) {
            request('context-menu');
            const handleClick = () => closeMenu();
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') closeMenu();
            };
            window.addEventListener('click', handleClick);
            window.addEventListener('keydown', handleEsc);
            return () => {
                window.removeEventListener('click', handleClick);
                window.removeEventListener('keydown', handleEsc);
                release('context-menu');
            };
        }
    }, [isOpen, closeMenu, request, release]);

    const handleItemClick = useCallback((e: React.MouseEvent, onClick: () => void) => {
        e.stopPropagation();
        console.log('[PetContextMenu] handleItemClick called, item:', onClick);
        try {
            onClick();
            console.log('[PetContextMenu] onClick executed successfully');
        } catch (err) {
            console.error('[PetContextMenu] onClick error:', err);
        }
        setTimeout(() => closeMenu(), 0);
    }, [closeMenu]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="pet-context-menu"
            style={{ left: `${adjustedPos.left}px`, top: `${adjustedPos.top}px` }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item) => (
                <div
                    key={item.key}
                    className={`pet-context-menu-item ${item.disabled ? 'disabled' : ''}`}
                    onClick={(e) => !item.disabled && handleItemClick(e, item.onClick)}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}

export default PetContextMenu;
