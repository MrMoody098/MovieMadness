import React from 'react';
import NavBar from "../NavBar";
import TvModal from "../TvModal";
import "../css/TVShows.css";
import useFetchItems from '../hooks/useFetchItems';

const TVShowsList = () => {
    const {
        items: tvShows,
        selectedItem: selectedTVShow,
        isModalOpen,
        searchQuery,
        setSearchQuery,
        hasMore,
        loading,
        handleItemClick,
        closeModal,
    } = useFetchItems('tv');

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery} />
            <div className={"tv-title"}><h2>TV Shows</h2></div>

            <div className="movies-container">
                {tvShows.map((tvShow) => (
                    <div
                        className="movie-card"
                        key={tvShow.id}
                        onClick={() => handleItemClick(tvShow)}
                    >
                        <div className="movie-poster">
                            <img src={tvShow.poster} alt={tvShow.name} />
                        </div>
                        <div className="movie-details">
                            <h2>{tvShow.name}</h2>
                            <p>Rating: {tvShow.vote_average || 'N/A'}</p>
                        </div>
                    </div>
                ))}

                <TvModal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    tvShow={selectedTVShow}
                    onTvShowSelect={handleItemClick} // Pass handleItemClick as onTvShowSelect
                />
            </div>

            {loading && <div>Loading...</div>}
        </div>
    );
};

export default TVShowsList;