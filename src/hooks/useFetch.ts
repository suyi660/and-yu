import type { Options, Result, Service } from 'ahooks/lib/useRequest/src/types'
import { useRequest } from 'ahooks'
import Rq, { downloadfile, isObject, } from '../fetch'
import type { RqInit, RequestOptions } from '../fetch'

type Obj = Record<string, unknown>;
export type Method = "get" | "post" | "put" | "delete" | "patch" | undefined | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseRequestOption<TData = any> extends Options<TData, any[]> {
    ignoreError?: boolean;
    returnData?: boolean;
    json?: Obj | any[];
    /** @deprecated 此属性已废弃，请使用json属性代替 */
    data?: Obj | any[];
    method?: Method;
    useQuerystring?: boolean;
}

const rq = new Rq();
const useFetch = <TData = any>(url: string, options?: UseRequestOption<TData>): Result<TData, any[]> => {
    const { ignoreError, returnData, method, useQuerystring, json, data, ...others } = options || {};

    const fetcher: Service<any, any> = (fetcherData?: Obj, fetcherOptions?: RequestOptions) => {
        if (isObject(fetcherData) && Object.prototype.hasOwnProperty.call(fetcherData, "nativeEvent")) {
            fetcherData = undefined;
        }
        const body = fetcherData ? fetcherData : json || data;

        fetcherOptions = Object.assign({}, { json: body, returnData, method, useQuerystring, ignoreError, }, fetcherOptions || {},);
        return rq.request(url, fetcherOptions);
    };

    return useRequest(fetcher, others);

};
useFetch.config = (options: RqInit = {}) => {
    rq.config(options);
}
export { downloadfile, rq, Rq }
export default useFetch;
