
import { useMemo } from 'react';

export default function useX(column: any[] | ((data: any) => any[])): number {
    if (!Array.isArray(column)) return 0;
    return useMemo(() => {
        if (!column.length) return 0;
        const columns = column.filter((item: any) => !item.hidden);
        return columns.reduce((a, b) => {
            return a + parseInt(b.width || 0);
        }, 0);
    }, [column]);
};  