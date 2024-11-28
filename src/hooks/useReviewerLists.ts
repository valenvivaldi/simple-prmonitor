import { useState, useEffect } from 'react';
import type { ReviewersList } from '../types';

export function useReviewerLists() {
    const [lists, setLists] = useState<ReviewersList[]>(() => {
        const stored = localStorage.getItem('gh-reviewer-lists');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('gh-reviewer-lists', JSON.stringify(lists));
    }, [lists]);

    const addList = (name: string) => {
        const newList: ReviewersList = {
            id: crypto.randomUUID(),
            name,
            users: []
        };
        setLists(prev => [...prev, newList]);
    };

    const removeList = (id: string) => {
        setLists(prev => prev.filter(list => list.id !== id));
    };

    const updateList = (updatedList: ReviewersList) => {
        setLists(prev => prev.map(list => 
            list.id === updatedList.id ? updatedList : list
        ));
    };

    return {
        lists,
        addList,
        removeList,
        updateList
    };
}