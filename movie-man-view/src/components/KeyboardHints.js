import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const alphabet = 'asdfghjklqwertyuiopzxcvbnm';
const clickable = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"]';
const editing = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]';

function visiblePosition(element) {
    if (!element.isConnected || element.matches(':disabled, [aria-disabled="true"]')
        || element.closest('[hidden], [inert], [aria-hidden="true"]')) return null;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    let left = Math.max(0, rect.left);
    let top = Math.max(0, rect.top);
    let right = Math.min(window.innerWidth, rect.right);
    let bottom = Math.min(window.innerHeight, rect.bottom);
    for (let parent = element; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return null;
        if (parent === element) continue;
        const bounds = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX || style.overflow)) {
            left = Math.max(left, bounds.left);
            right = Math.min(right, bounds.right);
        }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY || style.overflow)) {
            top = Math.max(top, bounds.top);
            bottom = Math.min(bottom, bounds.bottom);
        }
    }
    if (right <= left || bottom <= top) return null;
    const covering = document.elementFromPoint?.((left + right) / 2, (top + bottom) / 2);
    if (covering && !element.contains(covering)) return null;
    return { left, top };
}

function collectHints() {
    const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
    const scope = dialogs.length ? dialogs[dialogs.length - 1] : document.querySelector('.App');
    if (!scope) return [];
    const targets = Array.from(scope.querySelectorAll(clickable)).flatMap(element => {
        const position = visiblePosition(element);
        return position ? [{ element, ...position }] : [];
    });
    let length = 1;
    while (alphabet.length ** length < targets.length) length += 1;
    return targets.map((target, index) => {
        let label = '';
        for (let digit = 0; digit < length; digit += 1) {
            label = alphabet[index % alphabet.length] + label;
            index = Math.floor(index / alphabet.length);
        }
        return { ...target, label };
    });
}

export default function KeyboardHints() {
    const [display, setDisplay] = useState({ hints: [], prefix: '' });
    useEffect(() => {
        let hints = [];
        let prefix = '';
        const close = () => {
            if (!hints.length) return;
            hints = [];
            prefix = '';
            setDisplay({ hints, prefix });
        };
        const handleKey = event => {
            if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
            if (!hints.length) {
                if (event.key !== 'f' || event.shiftKey || event.repeat || event.defaultPrevented
                    || event.target.closest?.(editing)) return;
                hints = collectHints();
                if (!hints.length) return;
                event.preventDefault();
                event.stopPropagation();
                prefix = '';
                setDisplay({ hints, prefix });
                return;
            }
            if (event.key === 'Escape' || event.key === 'Backspace' || event.key.length === 1) {
                event.preventDefault();
                event.stopPropagation();
                if (event.repeat) return;
                if (event.key === 'Escape') { close(); return; }
                prefix = event.key === 'Backspace' ? prefix.slice(0, -1) : prefix + event.key.toLowerCase();
                const matches = hints.filter(hint => hint.label.startsWith(prefix));
                const target = matches.find(hint => hint.label === prefix)?.element;
                if (target) {
                    close();
                    if (visiblePosition(target)) {
                        target.focus({ preventScroll: true });
                        target.click();
                    }
                } else if (!matches.length) close();
                else setDisplay({ hints, prefix });
            } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) close();
        };
        document.addEventListener('keydown', handleKey, true);
        document.addEventListener('pointerdown', close, true);
        document.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('keydown', handleKey, true);
            document.removeEventListener('pointerdown', close, true);
            document.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, []);
    if (!display.hints.length) return null;
    return createPortal(<div className="keyboard-hints" aria-hidden="true">
        {display.hints.filter(hint => hint.label.startsWith(display.prefix)).map(hint =>
            <span className="keyboard-hint" key={hint.label} style={{ left: hint.left, top: hint.top }}>
                {hint.label.slice(display.prefix.length)}
            </span>)}
    </div>, document.body);
}
