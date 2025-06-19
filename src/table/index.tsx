import type { ProTableProps, UseTableProps, TableRef, TableState, } from './types';
import { create, } from 'zustand';
import { useRef, useMemo } from 'react';
import { Table, Form, Button, Space } from 'antd';
import { useMount, useToggle, useUpdate, useUpdateEffect } from 'ahooks';
import { getDataSource, getQuery, getTotal, QueryOptions, formatDate, removeEmpty } from '../utils/table';
import useFetch from '../hooks/useFetch';
import useX from '../hooks/useX';
import './style.css'

const defaultClassNames = {
    root: 'main-container',
    form: 'search-form',
    table: 'main-table',
}
const defaultStyles = {
    root: {},
    form: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    table: {},
    toolbar: {
        marginBottom: 15,
    },
};
const ProTable = <T extends Record<string, any>>(props: ProTableProps<T>) => {
    const {
        classNames = defaultClassNames,
        styles = defaultStyles,
        table,
        locale,
        dataKey = 'data',
        totalKey = 'total',
        manual = false,
        nostyle,
        url,
        params: urlParams,
        columns,
        form = {},
        alert,
        toolbar = null,
        pageSizeOptions = [10, 20, 50, 100],
        onBefore,
        pagination,
        loadingDelay = 300,
        method,
        scroll,
        ...prop
    } = props;

    const {
        title: formTitle,
        extra: formExtra,
        right: formRight,
        formItem,
        items,
        reset: formReset,
        dataForm,
        handleValues: formHandleValues,
        onResetBefore: formOnResetBefore,
        ...otherFormProps
    } = form;

    const formItems = formItem || items;
    const [ready, { toggle }] = useToggle();
    const { page, size, sorter, search, setState } = table.useStore();

    const { data = {}, loading, mutate } = useFetch(url, {
        method,
        onBefore,
        json: ProTable.getQuery({
            page,
            size,
            sorter,
            search,
            urlParams,
        }),
        ready,
        onFinally: toggle,
        onSuccess(data) {
            setState({
                data,
            });
        },
        loadingDelay,
    });

    const { dataSource, total, column, renderAlert } = useMemo(() => {
        return {
            column: typeof columns === 'function' ? columns(data as any) : columns,
            dataSource: getDataSource<T>(data as any, dataKey),
            renderAlert: typeof alert === 'function' ? alert(data as any) : alert,
            total: getTotal(totalKey, data)
        };
    }, [columns, data, dataKey, totalKey]);

    const onSearch = () => {
        if (formItems) {
            table.form.submit();
        } else {
            toggle();
        }
    };
    const onReset = () => {
        setState({
            size: 10,
            sorter: {},
        });

        if (formItems) {
            if (formOnResetBefore?.() === false) return;
            table.form.resetFields();
            if (formReset === undefined || formReset === true) {
                table.form.submit();
            }
        }
    };

    if (table) {
        table.run = onSearch;
        table.clear = () => mutate({});
        table.refresh = toggle;
        table.reset = () => {
            if (formItems) {
                onReset();
            }
        };
    }

    useUpdateEffect(() => {
        table.update();
    }, [sorter]);

    useMount(() => {
        if (manual) return;
        if (formItems) {
            table.form.submit();
        } else {
            toggle();
        }
    });

    const onFinish = (values: Record<string, unknown>) => {
        if (formHandleValues) {
            values = formHandleValues(values);
        }
        if (!values) return;
        setState({
            page: 1,
            search: values,
        });
        toggle();
    };

    const tableChange = (pagination: any, sorter: any) => {
        setState({
            page: pagination.current,
            size: pagination.pageSize,
            sorter,
        });
        toggle();
    };
    const x = useX(column);
    const y = scroll?.y;

    const renderTable = () => {
        return (
            <Table
                columns={column}
                loading={loading}
                scroll={{ x, y }}
                locale={locale}
                onChange={(p, _, sorter) => tableChange(p, sorter)}
                pagination={{
                    current: page,
                    pageSize: size,
                    showQuickJumper: pagination ? pagination.showQuickJumper : true,
                    showSizeChanger: pagination ? pagination.showSizeChanger : true,
                    hideOnSinglePage: pagination ? pagination.hideOnSinglePage : false,
                    pageSizeOptions,
                    total,
                    showTotal(total) {
                        return `共 ${total} 条记录`;
                    },
                }}
                dataSource={dataSource}
                {...prop}
            />
        )
    }

    return (
        <div
            className={classNames?.root ?? defaultClassNames.root}
            style={styles.root} >
            {!!formItems && (
                <div
                    className={classNames?.form ?? defaultClassNames.form}
                    style={styles.form}
                >
                    <Form
                        form={table.form}
                        layout="inline"
                        onFinish={onFinish}
                        {...otherFormProps}
                    >
                        {formTitle && <Form.Item>{formTitle}</Form.Item>}
                        {formItems}
                        <Form.Item>
                            <Space>
                                <Button type="primary" loading={loading} htmlType="submit">
                                    查询
                                </Button>
                                <Button onClick={onReset} disabled={loading}>重置</Button>
                                {formExtra}
                            </Space>
                        </Form.Item>
                    </Form>
                    {formRight}
                </div>
            )}
            <div
                className={classNames?.table ?? defaultClassNames.table}
                style={styles.table}
            >
                {toolbar && <div style={styles.toolbar}>{toolbar}</div>}
                {renderAlert}
                {
                    !!dataForm ?
                        <Form {...dataForm}>
                            {renderTable()}
                        </Form> :
                        renderTable()
                }
            </div>
        </div>
    );
};

ProTable.useTable = (options: UseTableProps = {}) => {
    const update = useUpdate();
    const [form] = Form.useForm();
    const tableRef = useRef<TableRef>(null);
    if (!tableRef.current) {
        const useStore = create<TableState<any>>((set) => ({
            page: options.page ?? 1,
            size: options.size ?? 10,
            sorter: options.sorter || {},
            search: {},
            data: {},
            setState(values = {}) {
                set(values);
            },
        }));
        tableRef.current = {
            form,
            //使用usestore 获取page,size,data,search， antd 
            useStore: useStore,
            run() { },
            clear() { },
            refresh: () => { },
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
};

ProTable.getQuery = getQuery;
ProTable.formatDate = formatDate;
ProTable.removeEmpty = removeEmpty;
//自定义配置参数组合方式.  默认提供 page,size，orderField，isAsc，...urlParams,...search
ProTable.config = (options: { getQuery?: (data: QueryOptions) => Record<string, unknown> } = {}) => {
    if (options.getQuery) {
        ProTable.getQuery = options.getQuery;
    }
}



export default ProTable;