import { getHistoryIds, recordPlayback } from '../../utils/mediaLibrary';
export const addMovieId = id => recordPlayback('movie', id);
export const getMovieIds = () => getHistoryIds('movie');
