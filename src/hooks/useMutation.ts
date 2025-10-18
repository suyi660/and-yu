
import { useMutation } from '@tanstack/react-query'
import { rq, } from '../fetch'
import { isObject, } from '../utils/util'
import type { UseMutationResult, UseMutationOptions } from '@tanstack/react-query'


interface Options<TData, TError = unknown, TVariables = void, TOnMutateResult = unknown>
    extends UseMutationOptions<TData, TError, TVariables, TOnMutateResult> {
    url: string;
    method?: string;
    json?: unknown;
    headers?: Record<string, string>;
}

export default function useMutationHooks<TData = unknown, TError = unknown, TVariables = void, TOnMutateResult = unknown>(
    options: Options<TData, TError, TVariables, TOnMutateResult>
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
    const {
        url,
        json,
        method,
        headers,
        ...others
    } = options;
    return useMutation<TData, TError, TVariables, TOnMutateResult>({
        mutationFn(data?: unknown): Promise<TData> {
            if (isObject(data) && Object.prototype.hasOwnProperty.call(data, "nativeEvent")) {
                data = undefined;
            }
            return rq.request(url, {
                method,
                json: data ?? json,
                headers,
            });
        },
        ...others,
    });
}