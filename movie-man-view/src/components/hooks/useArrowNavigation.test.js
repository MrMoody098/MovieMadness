import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import useArrowNavigation from './useArrowNavigation';

function Harness() {
    useArrowNavigation();
    return <div className="App"><p>Plain text</p><button>First</button><button>Second</button>
        <button disabled>Disabled</button><button hidden>Hidden</button><button>Below</button>
        <input aria-label="Search" /><select aria-label="Season"><option>1</option></select></div>;
}

function position(element, left, top, width = 100, height = 40) {
    element.getBoundingClientRect = () => ({ left, top, right: left + width, bottom: top + height, width, height });
}

beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    render(<Harness />);
    position(screen.getByText('First'), 0, 0);
    position(screen.getByText('Second'), 120, 0);
    position(screen.getByText('Disabled'), 105, 0);
    position(screen.getByText('Hidden'), 110, 0);
    position(screen.getByText('Below'), 0, 100);
    position(screen.getByLabelText('Search'), 240, 0);
    position(screen.getByLabelText('Season'), 360, 0);
});

test.each([
    ['arrow keys', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'],
])('%s move between controls in their visual direction and stop at edges', (_, left, down, up, right) => {
    fireEvent.keyDown(document.body, { key: right });
    expect(screen.getByText('First')).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: right });
    expect(screen.getByText('Second')).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: left });
    expect(screen.getByText('First')).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: down });
    expect(screen.getByText('Below')).toHaveFocus();
    expect(fireEvent.keyDown(document.activeElement, { key: down })).toBe(false);
    expect(screen.getByText('Below')).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: up });
    expect(screen.getByText('First')).toHaveFocus();
});

test('preserves native editing, select controls, modifiers and handled events', () => {
    for (const label of ['Search', 'Season']) {
        const element = screen.getByLabelText(label);
        element.focus();
        expect(fireEvent.keyDown(element, { key: 'ArrowLeft' })).toBe(true);
        for (const key of ['h', 'j', 'k', 'l']) {
            expect(fireEvent.keyDown(element, { key })).toBe(true);
        }
        expect(element).toHaveFocus();
    }
    const first = screen.getByText('First');
    first.focus();
    expect(fireEvent.keyDown(first, { key: 'ArrowRight', shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(first, { key: 'l', ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(first, { key: 'j', isComposing: true })).toBe(true);
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    handled.preventDefault();
    fireEvent(first, handled);
    expect(first).toHaveFocus();
});

test('keeps navigation inside an open dialog', () => {
    const { unmount } = render(<div role="dialog"><button>Close</button><button>Watch</button></div>);
    position(screen.getByText('Close'), 0, 0);
    position(screen.getByText('Watch'), 120, 0);
    screen.getByText('Close').focus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(screen.getByText('Watch')).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(screen.getByText('Watch')).toHaveFocus();
    unmount();
});
