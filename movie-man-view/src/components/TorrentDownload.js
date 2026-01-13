import React, { useState, useEffect } from 'react';
import torrentService from '../utils/torrentService';
import '../css/TorrentDownload.css';

const TorrentDownload = ({ imdbId, title, season, episode, isOpen, onClose }) => {
    const [torrents, setTorrents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeDownloads, setActiveDownloads] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Reset search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchPerformed(false);
            setTorrents([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && (imdbId || title) && !searchPerformed) {
            searchTorrents();
        }
    }, [isOpen, imdbId, title, season, episode, searchPerformed]);

    // Update active downloads periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDownloads(torrentService.getActiveDownloads());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const searchTorrents = async () => {
        if (!imdbId && !title) return;

        setLoading(true);
        try {
            // If season and episode are provided, search for specific episode
            if (season && episode) {
                const results = await torrentService.searchByImdbId(imdbId, title, 20, season, episode);
                setTorrents(results);
            } else {
                const results = await torrentService.searchByImdbId(imdbId, title, 20);
                setTorrents(results);
            }
            setSearchPerformed(true);
        } catch (error) {
            console.error('Failed to search torrents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (torrent) => {
        if (!torrent.magnet) {
            alert('No magnet link available for this torrent.');
            return;
        }

        try {
            const download = await torrentService.downloadTorrent(torrent.magnet);
            // Check if download already exists in the list
            setActiveDownloads(prev => {
                const exists = prev.find(d => d.id === download.id);
                if (exists) {
                    return prev;
                }
                return [...prev, download];
            });
        } catch (error) {
            console.error('Failed to start download:', error);
            alert(`Failed to start download: ${error.message || 'Unknown error'}`);
        }
    };

    const handlePause = (torrentId) => {
        torrentService.pauseDownload(torrentId);
        setActiveDownloads(prev => prev.map(d =>
            d.id === torrentId ? { ...d, status: 'paused' } : d
        ));
    };

    const handleResume = (torrentId) => {
        torrentService.resumeDownload(torrentId);
        setActiveDownloads(prev => prev.map(d =>
            d.id === torrentId ? { ...d, status: 'downloading' } : d
        ));
    };

    const handleCancel = (torrentId) => {
        torrentService.cancelDownload(torrentId);
        setActiveDownloads(prev => prev.filter(d => d.id !== torrentId));
    };

    const renderTorrentList = () => {
        if (loading) {
            return <div className="torrent-loading">Searching for torrents...</div>;
        }

        if (torrents.length === 0 && searchPerformed) {
            return <div className="torrent-no-results">No torrents found for this title.</div>;
        }

        return (
            <div className="torrent-list">
                {torrents.map((torrent, index) => (
                    <div key={index} className="torrent-item">
                        <div className="torrent-info">
                            <h4 className="torrent-title">{torrent.title}</h4>
                            <div className="torrent-details">
                                <span className="torrent-size">
                                    Size: {torrent.size}
                                </span>
                                <span className="torrent-seeds">
                                    Seeds: {torrent.seeds}
                                </span>
                                <span className="torrent-peers">
                                    Peers: {torrent.peers}
                                </span>
                                {torrent.provider && (
                                    <span className="torrent-provider">
                                        Via: {torrent.provider}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            className="torrent-download-btn"
                            onClick={() => handleDownload(torrent)}
                            disabled={!torrent.magnet}
                        >
                            Download
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    const renderActiveDownloads = () => {
        if (activeDownloads.length === 0) return null;

        return (
            <div className="active-downloads">
                <h3>Active Downloads</h3>
                {activeDownloads.map((download) => (
                    <div key={download.id} className="download-item">
                        <div className="download-info">
                            <h4>{download.name}</h4>
                            <div className="download-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${download.progress * 100}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">
                                    {Math.round(download.progress * 100)}%
                                </span>
                            </div>
                            <div className="download-stats">
                                <span>↓ {torrentService.formatSpeed(download.downloadSpeed)}</span>
                                <span>↑ {torrentService.formatSpeed(download.uploadSpeed)}</span>
                                <span>{download.peers} peers</span>
                                {download.timeRemaining > 0 && (
                                    <span>
                                        ETA: {Math.round(download.timeRemaining / 60)}m
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="download-controls">
                            {download.status === 'downloading' && (
                                <button
                                    className="download-pause-btn"
                                    onClick={() => handlePause(download.id)}
                                >
                                    Pause
                                </button>
                            )}
                            {download.status === 'paused' && (
                                <button
                                    className="download-resume-btn"
                                    onClick={() => handleResume(download.id)}
                                >
                                    Resume
                                </button>
                            )}
                            <button
                                className="download-cancel-btn"
                                onClick={() => handleCancel(download.id)}
                            >
                                Cancel
                            </button>
                        </div>
                        {download.status === 'completed' && (
                            <div className="download-completed">
                                ✅ Download completed!
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {(() => {
                                        const videoFile = torrentService.getPrimaryVideoFile(download.id);
                                        if (videoFile && videoFile.file) {
                                            return (
                                                <button
                                                    onClick={() => {
                                                        // Create a video element to play the file
                                                        const video = document.createElement('video');
                                                        video.controls = true;
                                                        video.style.width = '100%';
                                                        video.style.maxWidth = '800px';
                                                        
                                                        // Append the WebTorrent file to the video element
                                                        videoFile.file.appendTo(video);
                                                        
                                                        // Create a modal to show the video
                                                        const modal = document.createElement('div');
                                                        modal.style.position = 'fixed';
                                                        modal.style.top = '0';
                                                        modal.style.left = '0';
                                                        modal.style.width = '100%';
                                                        modal.style.height = '100%';
                                                        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
                                                        modal.style.display = 'flex';
                                                        modal.style.justifyContent = 'center';
                                                        modal.style.alignItems = 'center';
                                                        modal.style.zIndex = '10000';
                                                        
                                                        const closeBtn = document.createElement('button');
                                                        closeBtn.textContent = '×';
                                                        closeBtn.style.position = 'absolute';
                                                        closeBtn.style.top = '20px';
                                                        closeBtn.style.right = '20px';
                                                        closeBtn.style.fontSize = '40px';
                                                        closeBtn.style.color = 'white';
                                                        closeBtn.style.background = 'transparent';
                                                        closeBtn.style.border = 'none';
                                                        closeBtn.style.cursor = 'pointer';
                                                        closeBtn.onclick = () => {
                                                            document.body.removeChild(modal);
                                                            video.pause();
                                                        };
                                                        
                                                        modal.appendChild(video);
                                                        modal.appendChild(closeBtn);
                                                        document.body.appendChild(modal);
                                                    }}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    🎬 Play Video
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <button
                                        onClick={() => {
                                            const files = torrentService.getTorrentFiles(download.id);
                                            if (files.length > 0) {
                                                const fileList = files.map(f => `• ${f.name} (${torrentService.formatFileSize(f.length)})`).join('\n');
                                                alert(`Files in torrent:\n\n${fileList}`);
                                            } else {
                                                alert('No files found in this torrent.');
                                            }
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📁 View Files ({download.torrent?.files?.length || 0})
                                    </button>
                                </div>
                            </div>
                        )}
                        {download.status === 'error' && (
                            <div className="download-error">
                                ❌ Error: {download.error}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="torrent-modal-overlay">
            <div className="torrent-modal">
                <div className="torrent-modal-header">
                    <h2>Download Torrents</h2>
                    <button className="torrent-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="torrent-modal-content">
                    <div className="torrent-search-info">
                        <p>Searching for: <strong>{title || 'Unknown Title'}</strong></p>
                        {season && episode && (
                            <p>Season {season}, Episode {episode}</p>
                        )}
                        {imdbId ? (
                            <p>IMDB ID: {imdbId}</p>
                        ) : (
                            <p className="torrent-warning">⚠️ Searching by title only (no IMDB ID available)</p>
                        )}
                    </div>

                    {renderActiveDownloads()}
                    {renderTorrentList()}
                </div>

                <div className="torrent-modal-footer">
                    <button
                        className="torrent-refresh-btn"
                        onClick={() => {
                            setSearchPerformed(false);
                            searchTorrents();
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Refresh Search'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TorrentDownload;
