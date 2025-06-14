import type { Options, Result, Service } from 'ahooks/lib/useRequest/src/types'
import { useRequest } from 'ahooks'
import Query, { downloadfile, isObject, } from '../fetch'
import type { QueryInit, QueryOptions } from '../fetch'

type Obj = Record<string, unknown>;
export type Method = "get" | "post" | "put" | "delete" | "patch" | undefined | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseRequestOption<TData = any> extends Options<TData, any[]> {
    ignoreError?: boolean;
    returnData?: boolean;
    json?: Obj | any[];
    method?: Method;
}

const query = new Query();
const useFetch = <TData = any>(url: string, options?: UseRequestOption<TData>): Result<TData, any[]> => {
    const { ignoreError, returnData, method, json, ...others } = options || {};
    const fetcher: Service<any, any> = (fetcherData?: Obj, fetcherOptions?: QueryOptions) => {
        if (isObject(fetcherData) && Object.prototype.hasOwnProperty.call(fetcherData, "nativeEvent")) {
            fetcherData = undefined;
        }
        const body = fetcherData ?? json;
        fetcherOptions = Object.assign({}, { json: body, returnData, method, ignoreError, }, fetcherOptions || {},);
        return query.request(url, fetcherOptions);
    };

    return useRequest(fetcher, others);
};
useFetch.config = (options: QueryInit = {}) => {
    query.config(options);
}
export { downloadfile, query, Query }
export default useFetch;
