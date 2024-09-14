// src/hooks/useFetchItems.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const useFetchItems = (type) => {
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const fetchItems = async (query = '', page = 1) => {
        if (loading) return;

        setLoading(true);
        try {
            let url;
            if (query) {
                url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false&language=en-US&page=${page}`;
            } else {
                url = `https://api.themoviedb.org/3/trending/${type}/day?api_key=${TMDB_API_KEY}&page=${page}`;
            }

            const { data } = await axios.get(url);
            const modifiedItems = data.results.map((item) => ({
                ...item,
                poster: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500/${item.poster_path}`
                    : 'default-poster.jpg',
            }));

            setItems((prevItems) => [...prevItems, ...modifiedItems]);
            setHasMore(data.results.length > 0);
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems('', page);
    }, [page]);

    useEffect(() => {
        if (searchQuery) {
            setItems([]);
            setPage(1);
            fetchItems(searchQuery, 1);
        }
    }, [searchQuery]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop + 50 >=
            document.documentElement.offsetHeight
        ) {
            if (hasMore && !loading) {
                setPage((prevPage) => prevPage + 1);
            }
        }
    }, [hasMore, loading]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    return {
        items,
        selectedItem,
        isModalOpen,
        searchQuery,
        setSearchQuery,
        hasMore,
        loading,
        handleItemClick,
        closeModal,
    };
};

export default useFetchItems;