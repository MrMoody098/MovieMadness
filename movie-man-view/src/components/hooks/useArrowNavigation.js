import { useEffect } from 'react';

const controls = 'a[href], button, input, select, textarea, [tabindex]';
const nativeArrowControls = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="listbox"], [role="combobox"], [role="menu"], [role="tablist"], audio, video';

export default function useArrowNavigation() {
    useEffect(() => {
        const navigate = event => {
            const key = event.key;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)
                || event.isComposing
                || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
                || event.target.closest?.(nativeArrowControls)) return;

            const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
            const scope = dialogs.length ? dialogs[dialogs.length - 1] : document.querySelector('.App');
            if (!scope) return;
            const candidates = Array.from(scope.querySelectorAll(controls)).filter(element => {
                if (element.tabIndex < 0 || element.matches(':disabled')
                    || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return style.visibility !== 'hidden' && style.display !== 'none'
                    && rect.width > 0 && rect.height > 0;
            });

            // Cancel the browser's text caret and page scrolling, including at an edge.
            event.preventDefault();
            const current = document.activeElement;
            let next;
            if (!candidates.includes(current)) {
                next = candidates.find(element => {
                    const rect = element.getBoundingClientRect();
                    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
                });
            } else {
                const from = current.getBoundingClientRect();
                const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
                const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
                let bestScore = Infinity;
                for (const element of candidates) {
                    if (element === current) continue;
                    const to = element.getBoundingClientRect();
                    const dx = (to.left + to.right - from.left - from.right) / 2;
                    const dy = (to.top + to.bottom - from.top - from.bottom) / 2;
                    const forward = (horizontal ? dx : dy) * direction;
                    if (forward <= 1) continue;
                    const cross = Math.abs(horizontal ? dy : dx);
                    const aligned = horizontal
                        ? to.top < from.bottom && to.bottom > from.top
                        : to.left < from.right && to.right > from.left;
                    const score = forward + cross * 3 + (aligned ? 0 : 10000);
                    if (score < bestScore) { next = element; bestScore = score; }
                }
            }
            if (next) {
                next.focus({ preventScroll: true });
                next.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
            }
        };
        document.addEventListener('keydown', navigate);
        return () => document.removeEventListener('keydown', navigate);
    }, []);
}
