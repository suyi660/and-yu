type Func = () => Record<string, any>;
type DefaultHeaders = Record<string, any> | Func | HeadersInit;
export interface RqInit {
    baseUrl?: string;
    blobFileTypes?: string[];
    onError?: (error: any) => void;
    onLogout?: (error: any) => void;
    headers?: DefaultHeaders;
    returnData?: boolean;
    useQuerystring?: boolean;
    code?: {
        success?: number[];
        logout?:  number[];
        ignoreError?: number[];
    }
}
export interface RequestOptions extends RequestInit {
    json?: Record<string, any> | any[];
    data?: Record<string, any> | any[];
    ignoreError?: boolean;
    returnData?: boolean;
    useQuerystring?: boolean;
}
export const isObject = (oj: unknown) => Object.prototype.toString.call(oj) === '[object Object]';
export const isFunction = (oj: unknown) => Object.prototype.toString.call(oj) === '[object Function]';

class Query {
    options = {
        baseUrl: '',
        blobFileTypes: ['stream', 'excel', 'download', 'blob'],
        code: {
            success: [200],
            logout: [403],
            ignoreError: [],
        },
        onLogout: undefined,
        onError: undefined,
        headers: undefined,
        returnData: true,
        useQuerystring: false,
    } as RqInit;
    constructor(options?: RqInit) {
        if (options) {
            this.options = Object.assign(this.options, options);
        }
    }
    static create(options: RqInit) {
        return new Rq(options);
    }
    config(options: RqInit) {
        if (!isObject(options)) throw new Error('options must be object {}');
        this.options = Object.assign(this.options, options);
    }
    createUrl(url: string) {
        if (typeof url !== 'string') {
            throw new Error('url must be string');
        }
        const baseUrl = this.options.baseUrl;
        const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const normalizedUrl = url.charAt(0) === '/' ? url.slice(1) : url;
        return normalizedBaseUrl + normalizedUrl;
    }

    createQueryUrl(url: string, query: Record<string, string>) {
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

    handleDefaultHeader() {
        let defaultHeaders = this.options.headers;
        if (isFunction(defaultHeaders)) defaultHeaders = (defaultHeaders as Func)();
        const headers = new Headers({ 'Content-Type': 'application/json;charset=UTF-8' });
        if (isObject(defaultHeaders)) {
            Object.entries(defaultHeaders).forEach(([key, value]) => {
                headers.set(key, value as string);
            });
        }
        return headers;
    }
    get(url: string, options?: RequestOptions) {
        return this.request(url, { method: 'GET', ...options });
    }
    post(url: string, options?: RequestOptions) {
        return this.request(url, { method: 'POST', ...options });
    }
    delete(url: string, options?: RequestOptions) {
        return this.request(url, { method: 'DELETE', ...options });
    }
    put(url: string, options?: RequestOptions) {
        return this.request(url, { method: 'PUT', ...options });
    }
    async request(url: string, options?: RequestOptions) {
        if (!options) options = {};
        const ignoreError = options.ignoreError;
        const headers = this.handleDefaultHeader();
        options.headers = new Headers({ ...Object.fromEntries(headers), ...options.headers });
        options.method = options.method ?? 'POST';

        url = this.createUrl(url);
        if (['GET', 'HEAD'].includes(options.method.toUpperCase())) {
            if (options.json && isObject(options.json)) {
                url = this.createQueryUrl(url, options.json as Record<string, string>);
            }
        } else {
            if (options.useQuerystring) {
                url = this.createQueryUrl(url, options.json as Record<string, string>);
                options.json = undefined;
            }
            if (options.json) {
                if (options.json instanceof FormData) {
                    options.headers.delete('Content-Type');
                    options.body = options.json;
                    delete options.headers['Content-Type'];
                } else {
                    options.body = JSON.stringify(options.json);
                    options.json = undefined;
                }
            } else {
                if (options.body && options.json instanceof FormData) {
                    delete options.headers['Content-Type'];
                }
            }
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(response.statusText);
            const contentType = (response.headers.get('content-type') || '').toLocaleLowerCase();

            if (this.options.blobFileTypes.some(it => contentType.includes(it))) {
                const blob = await response.blob();
                return { code: 200, data: blob, response };
            }

            const data = await response.json();
            const successCode = this.options.code?.success || [];
            const logoutCode = this.options.code?.logout || [];
            const ignoreErrorCode = this.options.code?.ignoreError || [];
            if (successCode.includes(data?.code)) {
                if (this.options.returnData === false || options.returnData === false) {
                    return data;
                } else {
                    return data.hasOwnProperty('data') ? data.data : data;
                }
            }
            if (ignoreError || ignoreErrorCode.includes(data?.code)) {
                return Promise.reject(data);
            }
            if (logoutCode.includes(data?.code)) {
                this.options.onLogout?.(data);
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

export default Query;