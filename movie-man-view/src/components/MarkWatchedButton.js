import React, { useState } from 'react';
import { recordPlayback } from '../utils/mediaLibrary';

export default function MarkWatchedButton({ id, type }) {
    const [marked, setMarked] = useState(false);
    return <>
        <button className="text-button" onClick={() => { if (recordPlayback(type, id)) setMarked(true); }}>Mark as watched</button>
        {marked && <span role="status">Added to Recently watched.</span>}
    </>;
}
