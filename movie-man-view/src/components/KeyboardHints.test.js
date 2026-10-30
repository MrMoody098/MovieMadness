import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KeyboardHints from './KeyboardHints';

function position(element, left = 20, top = 20) {
    element.getBoundingClientRect = () => ({ left, top, right: left + 100, bottom: top + 40, width: 100, height: 40 });
}

function labels() {
    return Array.from(document.querySelectorAll('.keyboard-hint'));
}

function press(key, options = {}) {
    return fireEvent.keyDown(document.activeElement || document.body, { key, ...options });
}

test('f labels visible controls and a label activates its target', () => {
    const click = jest.fn();
    render(<div className="App"><KeyboardHints /><button onClick={click}>Open movie</button>
        <input aria-label="Search" /><button disabled>Disabled</button><button hidden>Hidden</button>
        <button>Offscreen</button></div>);
    for (const element of document.querySelectorAll('button, input')) position(element);
    position(screen.getByText('Offscreen'), 20, window.innerHeight + 100);
    press('f');
    expect(labels().map(label => label.textContent)).toEqual(['a', 's']);
    press('a');
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Open movie')).toHaveFocus();
    expect(labels()).toHaveLength(0);
    press('f');
    press('s');
    expect(screen.getByLabelText('Search')).toHaveFocus();
    expect(press('f')).toBe(true);
    expect(labels()).toHaveLength(0);
});

test('uses unique multi-letter hints for many controls and supports backspace and Escape', () => {
    const click = jest.fn();
    render(<div className="App"><KeyboardHints />{Array.from({ length: 30 }, (_, index) =>
        <button key={index} onClick={() => click(index)}>Movie {index}</button>)}</div>);
    for (const element of screen.getAllByRole('button')) position(element);
    press('f');
    const allLabels = labels().map(label => label.textContent);
    expect(new Set(allLabels).size).toBe(30);
    expect(allLabels.every(label => label.length === 2)).toBe(true);
    press('s');
    expect(labels()).toHaveLength(4);
    expect(click).not.toHaveBeenCalled();
    press('Backspace');
    expect(labels()).toHaveLength(30);
    press('s');
    press('a');
    expect(click).toHaveBeenCalledWith(26);
    expect(labels()).toHaveLength(0);
    press('f');
    press('Escape');
    expect(labels()).toHaveLength(0);
});

test('limits hints to the modal and cancels on scrolling or an invalid label', () => {
    const click = jest.fn();
    render(<div className="App"><KeyboardHints /><button>Background</button>
        <div role="dialog"><button onClick={click}>Close</button></div></div>);
    for (const element of screen.getAllByRole('button')) position(element);
    press('f');
    expect(labels()).toHaveLength(1);
    press('z');
    expect(labels()).toHaveLength(0);
    expect(click).not.toHaveBeenCalled();
    press('f');
    fireEvent.scroll(document);
    expect(labels()).toHaveLength(0);
    press('f');
    press('a');
    expect(click).toHaveBeenCalledTimes(1);
});

test('preserves typing, browser shortcuts and held keys', () => {
    render(<div className="App"><KeyboardHints /><input aria-label="Search" />
        <div contentEditable suppressContentEditableWarning tabIndex={0}>Editor</div><button>Open</button></div>);
    position(screen.getByText('Open'));
    for (const element of [screen.getByLabelText('Search'), screen.getByText('Editor')]) {
        element.focus();
        expect(press('f')).toBe(true);
        expect(labels()).toHaveLength(0);
    }
    screen.getByText('Open').focus();
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { repeat: true }, { isComposing: true }]) {
        expect(press('f', options)).toBe(true);
        expect(labels()).toHaveLength(0);
    }
});

test('does not label controls clipped by a carousel', () => {
    render(<div className="App"><KeyboardHints /><div style={{ overflow: 'hidden' }} data-testid="rail">
        <button>Visible</button><button>Clipped</button></div></div>);
    position(screen.getByTestId('rail'));
    position(screen.getByText('Visible'));
    position(screen.getByText('Clipped'), 200);
    press('f');
    expect(labels()).toHaveLength(1);
});
