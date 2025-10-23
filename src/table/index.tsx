import type { ProTableProps, ProTableConfigOptions, } from './types';
import { I18nContext, t } from '../components/TableConfig'
import { useShallow } from 'zustand/react/shallow';
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useContext } from 'react';
import { Table, Form, Button, Space } from 'antd';
import { useMount, useUpdateEffect } from 'react-use';
import { getDataSource, getQuery, getTotal, formatDate, removeEmpty } from '../utils/table';
import { isObject } from '../utils/util';
import useQuery from '../hooks/useQuery';
import useX from '../hooks/useX';
import useTable from './useTable'
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
        pageSizeOptions,
        onBefore,
        onSuccess,
        pagination,
        method,
        scroll,
        useData,
        ...prop
    } = props;

    const { lang } = useContext(I18nContext);

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
    const forceKey = useRef(0);
    const formItems = formItem || items;
    const queryClient = useQueryClient();
    const { page, size, sorter, search, ready, setState } = table.useStore(useShallow(state => {
        return {
            page: state.page,
            size: state.size,
            sorter: state.sorter,
            search: state.search,
            ready: state.ready,
            setState: state.setState,
        };
    }));
    const queryKey = useMemo(() => [
        url,
        ProTable.getQuery({
            page,
            size,
            sorter,
            search,
            urlParams,
        }),
        forceKey.current,
    ], [url, page, size, sorter, search, urlParams]);
    const { data = {}, isLoading, refetch, isSuccess } = useQuery({
        queryKey,
        method,
        onBefore,
        enabled: ready,
    });

    useUpdateEffect(() => {
        if (useData) {
            setState({
                data,
            })
        }
    }, [data])
    useUpdateEffect(() => {
        onSuccess?.(data as any)
    }, [isSuccess])

    const { dataSource, total, column, renderAlert } = useMemo(() => {
        return {
            column: typeof columns === 'function' ? columns(data as any,) : columns,
            dataSource: getDataSource<T>(data as any, dataKey),
            renderAlert: typeof alert === 'function' ? alert(data as any) : alert,
            total: getTotal(totalKey, data)
        };
    }, [columns, data, dataKey, totalKey]);

    const onSearch = () => {
        if (formItems) {
            table.form.submit();
        } else {
            setState({
                ready: true,
            })
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

    useEffect(() => {
        if (table) {
            table.run = onSearch;
            table.queryKey = queryKey;
            table.clear = () => queryClient.setQueryData(queryKey, {});
            table.refresh = refetch;
            table.reset = () => {
                if (formItems) {
                    onReset();
                }
            };
        }
    }, [table, queryKey])

    useUpdateEffect(() => {
        table.update();
    }, [sorter]);

    useMount(() => {
        if (manual) return;
        if (formItems) {
            table.form.submit();
        } else {
            setState({
                ready: true,
            })
        }
    });

    const onFinish = useCallback((values: Record<string, unknown>) => {
        if (formHandleValues) {
            values = formHandleValues(values);
        }
        if (!values) return;
        //更新 queryKey, userquery force refetch
        forceKey.current += 1;
        setState({
            page: 1,
            search: values,
            ready: true,
        });
    }, []);

    const tableChange = useCallback((pagination: any, sorter: any) => {
        setState({
            page: pagination.current,
            size: pagination.pageSize,
            sorter,
            ready: true,
        });
    }, []);
    const x = useX(column);
    const y = scroll?.y;

    const renderTable = () => {
        return (
            <Table
                columns={column as any}
                loading={isLoading}
                scroll={{ x, y }}
                locale={locale}
                onChange={(p, _, sorter) => tableChange(p, sorter)}
                pagination={{
                    current: page,
                    pageSize: size,
                    showQuickJumper: pagination ? pagination.showQuickJumper : true,
                    showSizeChanger: pagination ? pagination.showSizeChanger : true,
                    hideOnSinglePage: pagination ? pagination.hideOnSinglePage : false,
                    pageSizeOptions: pageSizeOptions || ProTable.pageSizeOptions,
                    total,
                    showTotal(total) {
                        return `${t("共", lang)} ${total} ${t("条记录", lang)}`;
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
                                <Button type="primary" loading={isLoading} htmlType="submit">
                                    {t('搜索', lang)}
                                </Button>
                                <Button onClick={onReset} disabled={isLoading}>{t('重置', lang)}</Button>
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

ProTable.useTable = useTable;
ProTable.getQuery = getQuery;
ProTable.formatDate = formatDate;
ProTable.removeEmpty = removeEmpty;
ProTable.pageSizeOptions = [10, 20, 50, 100];
//自定义配置参数组合方式.  默认提供 page,size，orderField，isAsc，...urlParams,...search
ProTable.config = (options: ProTableConfigOptions) => {
    if (!options || !isObject(options)) return;
    if (options.getQuery) {
        ProTable.getQuery = options.getQuery;
    }
    if (options.pageSizeOptions) {
        ProTable.pageSizeOptions = options.pageSizeOptions;
    }
};



export default ProTable;