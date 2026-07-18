export interface IPetBubblePositionResult {
    left: number;
    top: number;
    placement: 'top' | 'bottom' | 'left' | 'right';
    arrowPlacement: 'bottom' | 'top' | 'right' | 'left';
}

export function calculateBubblePosition(
    petX: number,
    petY: number,
    petWidth: number,
    petHeight: number,
    bubbleWidth: number,
    bubbleHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    gap: number = 12,
): IPetBubblePositionResult {
    const petLeft = petX - petWidth / 2;
    const petRight = petX + petWidth / 2;
    const petTop = petY - petHeight / 2;
    const petBottom = petY + petHeight / 2;

    const spaceTop = petTop;
    const spaceBottom = viewportHeight - petBottom;
    const spaceLeft = petLeft;
    const spaceRight = viewportWidth - petRight;

    let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
    let maxSpace = spaceTop;

    if (spaceBottom > maxSpace) {
        maxSpace = spaceBottom;
        placement = 'bottom';
    }
    if (spaceLeft > maxSpace) {
        maxSpace = spaceLeft;
        placement = 'left';
    }
    if (spaceRight > maxSpace) {
        maxSpace = spaceRight;
        placement = 'right';
    }

    let left = 0;
    let top = 0;
    let arrowPlacement: 'bottom' | 'top' | 'right' | 'left' = 'bottom';

    switch (placement) {
        case 'top':
            left = petX;
            top = petTop - gap - bubbleHeight;
            arrowPlacement = 'bottom';
            break;
        case 'bottom':
            left = petX;
            top = petBottom + gap;
            arrowPlacement = 'top';
            break;
        case 'left':
            left = petLeft - gap - bubbleWidth;
            top = petY;
            arrowPlacement = 'right';
            break;
        case 'right':
            left = petRight + gap;
            top = petY;
            arrowPlacement = 'left';
            break;
    }

    if (placement === 'top' || placement === 'bottom') {
        const halfWidth = bubbleWidth / 2;
        if (left - halfWidth < 10) {
            left = halfWidth + 10;
        } else if (left + halfWidth > viewportWidth - 10) {
            left = viewportWidth - halfWidth - 10;
        }
    } else {
        const halfHeight = bubbleHeight / 2;
        if (top - halfHeight < 10) {
            top = halfHeight + 10;
        } else if (top + halfHeight > viewportHeight - 10) {
            top = viewportHeight - halfHeight - 10;
        }
    }

    return { left, top, placement, arrowPlacement };
}
