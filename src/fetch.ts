import { RqInit, RqOptions, FunctionType } from './types'
export const isObject = (oj: unknown) => Object.prototype.toString.call(oj) === '[object Object]';
export const isFunction = (oj: unknown) => Object.prototype.toString.call(oj) === '[object Function]';

const defaultSuccessCode = [200];
const defaultLogoutCode = [403];
const defaultMethod = 'get';

class Rq {
    options = {
        baseUrl: '',
        blobFileTypes: ['stream', 'excel', 'download', 'blob'],
        code: {
            success: defaultSuccessCode,
            logout: defaultLogoutCode,
            ignoreError: [],
        },
        codeKey: 'code',
        defaultMethod,
        onLogout: undefined,
        onError: undefined,
        headers: undefined,
        returnData: false,
    } as RqInit;
    constructor(options?: RqInit) {
        if (isObject(options)) {
            this.options = Object.assign(this.options, options);
        }
    }
    config(options: RqInit) {
        if (!isObject(options)) throw new Error('options must be object {}');
        this.options = Object.assign(this.options, options);
    }
    createUrlPath(url: string) {
        if (typeof url !== 'string') {
            throw new Error('url must be string');
        }
        const baseUrl = this.options.baseUrl ?? '';
        const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
        return normalizedBaseUrl + normalizedUrl;
    }
    createUrlQuery(url: string, query: any) {
        if (!isObject(query)) {
            throw new Error('create query must be object {}');
        }
        let queryStr: any = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }
            queryStr.append(key, value);
        });
        queryStr = queryStr.toString();
        if (url.includes('?')) {
            if (url.endsWith('&')) {
                return `${url}${queryStr}`;
            }
            return `${url}&${queryStr}`;
        }
        return `${url}?${queryStr}`;
    }

    createHeaders(headers?: any): Headers {
        headers = headers ?? this.options.headers;
        if (!isFunction(headers) && !isObject(headers)) return new Headers();
        if (isFunction(headers)) {
            headers = (headers as FunctionType)() || {};
        }
        headers = new Headers(headers);
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json;charset=UTF-8');
        }
        return headers;
    }
    get(url: string, options?: RqOptions) {
        return this.request(url, { method: 'GET', ...options });
    }
    post(url: string, options?: RqOptions) {
        return this.request(url, { method: 'POST', ...options });
    }
    delete(url: string, options?: RqOptions) {
        return this.request(url, { method: 'DELETE', ...options });
    }
    put(url: string, options?: RqOptions) {
        return this.request(url, { method: 'PUT', ...options });
    }
    async request(url: string, options?: RqOptions) {
        if (!options) options = {};
        const ignoreError = options.ignoreError;
        const codeKey = this.options.codeKey ?? 'code';
        const returnData = options.returnData ?? this.options.returnData;
        const onLogout = options.onLogout ?? this.options.onLogout;
        options.headers = this.createHeaders(options.headers);
        options.method = options.method ?? (this.options.defaultMethod || defaultMethod);

        const json = options.json ?? options.data;
        url = this.createUrlPath(url);
        if (json) {
            if (['GET', 'HEAD'].includes(options.method.toUpperCase())) {
                if (isObject(json)) {
                    url = this.createUrlQuery(url, options.json);
                }
            } else {
                if (json instanceof FormData) {
                    options.headers.delete('Content-Type');
                    options.body = json;
                } else {
                    options.body = JSON.stringify(options.json);
                }
            }
        }
        const {
            success: successCode = defaultSuccessCode,
            logout: logoutCode = defaultLogoutCode,
            ignoreError: ignoreErrorCode = [],
        } = this.options.code ?? {};

        try {
            const response = await window.fetch(url, options);
            if (!response.ok) throw new Error(response.statusText);
            const contentType = (response.headers.get('content-type') ?? '').toLocaleLowerCase();

            if (this.options.blobFileTypes.some(it => contentType.includes(it))) {
                const blob = await response.blob();
                return { [codeKey]: successCode.at(0), data: blob, response };
            }

            const data = await response.json();
            if (!data.hasOwnProperty(codeKey)) {
                return data;
            }
            const currentCode = data[codeKey];
            if (successCode.includes(currentCode)) {
                if (returnData && data.hasOwnProperty('data')) {
                    return data.data;
                }
                return data;
            }
            if (ignoreError || ignoreErrorCode.includes(currentCode)) {
                return Promise.reject(data);
            }
            if (logoutCode.includes(currentCode)) {
                onLogout?.(data);
            }
            this.options.onError?.(data);
            return Promise.reject(data)
        } catch (error) {
            this.options.onError?.(error);
            return Promise.reject(error);
        }

    }
}

//use response download 
export const downloadfile = (res: any) => {
    let { data, headers, response } = res;
    if (!headers && response && response.headers) {
        headers = response.headers;
    }
    const filename = decodeURIComponent((headers?.get('content-disposition') || '').split('filename=')[1])?.replaceAll('"', '');
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export const rq: Rq = new Rq();
export default Rq;