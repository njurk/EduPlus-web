import { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface CMSContent {
    [key: string]: string;
}

export const useCMSContent = (pageLabel: string) => {
    const [content, setContent] = useState<CMSContent>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await api.cms.getByPageLabel(pageLabel);
                const mapped: CMSContent = {};
                data.forEach((item) => {
                    mapped[item.key] = item.value;
                });
                setContent(mapped);
            } catch (error) {
                console.error(`Błąd ładowania treści z CMS dla: ${pageLabel}`, error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [pageLabel]);

    const getText = (key: string): string => {
        return content[key] ?? '';
    };

    return { getText, loading, content };
};
