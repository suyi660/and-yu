
import { Form } from 'antd';
import { useRef, } from 'react';
import { useUpdate, } from 'react-use';
import { create, } from 'zustand';
import type { UseTableProps, TableRef, TableState, } from './types';

const useTable = (options: UseTableProps = {}) => {
    const update = useUpdate();
    const [form] = Form.useForm();
    const tableRef = useRef<TableRef>(null);

    if (!tableRef.current) {
        const useStore = create<TableState>((set) => ({
            page: options.page ?? 1,
            size: options.size ?? 10,
            sorter: options.sorter || {},
            search: {},
            params: {
                page: options.page ?? 1,
                size: options.size ?? 10,
                sorter: options.sorter || {},
                form: {}
            },
            data: {},
            ready: false,
            setState(values = {}) {
                set(values);
            },
        }));
        tableRef.current = {
            form,
            useStore: useStore,
            run() { },
            clear: () => {
                useStore.setState({
                    data: {},
                })
            },
            refresh: () => {
                useStore.setState({
                    ready: true,
                })
            },
            reset: () => { },
            sortOrder(key: string) {
                const sorter = useStore.getState().sorter;
                if (sorter && sorter.field === key) {
                    return sorter.order;
                }
                return null
            },
            update,
        };
    }
    return [tableRef.current];
}

export default useTable;