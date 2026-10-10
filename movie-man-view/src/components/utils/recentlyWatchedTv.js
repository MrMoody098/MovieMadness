import { getHistoryIds, recordPlayback } from '../../utils/mediaLibrary';
export const addTvShowId = id => recordPlayback('tv', id);
export const getTvShowIds = () => getHistoryIds('tv');
