export interface PageContent {
    id: number;
    pageId: number;
    key: string;
    value: string;
}

export interface Page {
    id: number;
    title: string;
    link: string;
    position: number;
    targetId: number;
}

export interface Target {
    id: number;
    label: string;
    title: string;
}
