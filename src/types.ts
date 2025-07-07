import type { Options, } from 'ahooks/lib/useRequest/src/types'

// export type HeadersInit = [string, string][] | Record<string, string> | Headers;

// export type Headers = RequestInit["headers"]
export type Method = "get" | "post" | "put" | "delete" | "patch" | undefined | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type FunctionType = () => Record<string, any>;
export type JsonData = Record<string, any> | any[] | null;

export interface RqInit {
    //请求的基础url
    baseUrl?: string;
    //流数据response 响应头类型
    blobFileTypes?: string[];
    //错误的回调函数 非code?.ignoreError 且非code?.success的错误
    onError?: (error: any) => void;
    //退的code的回调函数->对应code?.logout
    onLogout?: (error: any) => void;
    headers?: Headers;
    //响应数据状态码的key default: code
    codeKey?: string;
    // 返回response响应体 data层
    returnData?: boolean;
    //响应数据状态码的值
    code?: {
        success?: number[];
        logout?: number[];
        ignoreError?: number[];
    },
    //默认请求方法
    defaultMethod?: Method;
}
export interface RqOptions extends RequestInit {
    //请求体数据
    data?: JsonData;
    json?: JsonData;
    //是否忽略当前的请求错误 配置为true,  则不会触发 onError callback
    ignoreError?: boolean;
    returnData?: boolean;
}

export interface UseFetchOption<TData = any> extends Options<TData, any[]> {
    ignoreError?: boolean;
    returnData?: boolean;
    json?: Record<string, unknown> | any[];
    data?: Record<string, unknown> | any[];
    method?: Method;
    headers?: HeadersInit;
}