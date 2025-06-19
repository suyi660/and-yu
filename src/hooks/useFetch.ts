import { useRequest, } from 'ahooks'
import { isObject, rq } from '../fetch'
import type { RqInit, RqOptions, JsonData, UseFetchOption } from '../types'
import type { Result, Service } from 'ahooks/lib/useRequest/src/types'


const useFetch = <TData = any>(url: string, options?: UseFetchOption<TData>): Result<TData, any[]> => {
    const { ignoreError, returnData, method, json, data, ...others } = options || {};
    let body = json ?? data;

    const fetcher: Service<any, any> = (fetcherData?: JsonData, fetcherOptions?: RqOptions) => {
        if (isObject(fetcherData) && Object.prototype.hasOwnProperty.call(fetcherData, "nativeEvent")) {
            fetcherData = undefined;
        }
        body = fetcherData ?? body;
        fetcherOptions = fetcherOptions ?? {};
        fetcherOptions = {
            json: body,
            returnData,
            method,
            ignoreError,
            ...fetcherOptions,
        }
        return rq.request(url, fetcherOptions);
    };

    return useRequest(fetcher, others);
};
useFetch.config = (options: RqInit = {}) => {
    rq.config(options);
}
export default useFetch;
