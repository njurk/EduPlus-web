import { createContext, useContext } from 'react';
import type { UnreadCounts } from '../types';

const defaultValue: UnreadCounts = { announcements: 0, tickets: 0, excuses: 0, unreadAnnouncementIds: [] };
const UnreadContext = createContext<UnreadCounts>(defaultValue);

export { UnreadContext };
export const useUnread = () => useContext(UnreadContext);
