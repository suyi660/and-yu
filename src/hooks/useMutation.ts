
import { useMutation } from '@tanstack/react-query'
import { rq, } from '../fetch'
import { isObject, } from '../utils/util'
import type { UseMutationResult, UseMutationOptions } from '@tanstack/react-query'

interface Options extends UseMutationOptions {
    url: string;
    method?: string;
    json?: unknown;
    headers?: Record<string, string>;
}

export default function useMutationHooks<TData = unknown>(options: Options): UseMutationResult<TData> {
    const {
        url,
        json,
        method,
        headers,
        ...others
    } = options;
    return useMutation({
        mutationFn(data: unknown) {
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