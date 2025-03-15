/**
 * @module call
 * @description Provides HTTP API call functionality for Frappe.
 * This module handles REST API calls with authentication support and
 * standardized error handling.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { FrappeApp } from '@frappe/sdk';
 *
 * const app = new FrappeApp('https://erp.example.com');
 * const call = app.call();
 *
 * // Make a GET request
 * const response = await call.get('frappe.ping');
 *
 * // Make a POST request with data
 * const result = await call.post('frappe.handler', {
 *   data: { key: 'value' }
 * });
 * ```
 */

import { AxiosInstance } from 'axios'

import { ApiParams, TypedResponse } from './types'
import { handleRequest } from '../utils/axios'

/**
 * Handles HTTP API calls to Frappe endpoints.
 *
 * @class FrappeCall
 * @description Provides methods for making authenticated HTTP requests
 * to Frappe API endpoints with standardized error handling.
 *
 * @example
 * ```typescript
 * const call = new FrappeCall(
 *   'https://erp.example.com',
 *   axiosInstance,
 *   true,
 *   () => localStorage.getItem('token'),
 *   'Bearer'
 * );
 *
 * // Make API calls
 * const response = await call.get('frappe.ping');
 * ```
 */
export class FrappeCall {
    /** URL of the Frappe App instance */
    // @ts-expect-error - This is a private property that is not used in the class
    private readonly appURL: string

    /** Axios instance for making HTTP requests */
    readonly axios: AxiosInstance

    /** Whether to use token based authentication */
    readonly useToken: boolean

    /** Function that returns the authentication token */
    readonly token?: () => string

    /** Type of token to be used for authentication */
    readonly tokenType?: 'Bearer' | 'token'

    /**
     * Creates a new FrappeCall instance.
     *
     * @param appURL - Base URL of the Frappe instance
     * @param axios - Configured Axios instance for making requests
     * @param useToken - Whether to use token-based authentication
     * @param token - Function that returns the authentication token
     * @param tokenType - Type of token to use ('Bearer' or 'token')
     *
     * @example
     * ```typescript
     * const call = new FrappeCall(
     *   'https://erp.example.com',
     *   axiosInstance,
     *   true,
     *   () => localStorage.getItem('token'),
     *   'Bearer'
     * );
     * ```
     */
    constructor(
        appURL: string,
        axios: AxiosInstance,
        useToken?: boolean,
        token?: () => string,
        tokenType?: 'Bearer' | 'token',
    ) {
        this.appURL = appURL
        this.axios = axios
        this.useToken = useToken ?? false
        this.token = token
        this.tokenType = tokenType
    }

    /**
     * Makes a GET request to a Frappe API endpoint.
     *
     * @template T - Type of the response data
     * @param path - API endpoint path
     * @param params - Query parameters
     * @returns Promise resolving to the response data
     * @throws {Error} If the request fails
     *
     * @example
     * ```typescript
     * // Simple GET request
     * const ping = await call.get('frappe.ping');
     *
     * // GET request with parameters
     * const users = await call.get<User[]>('frappe.user.get_users', {
     *   filters: { user_type: 'System User' }
     * });
     * ```
     */
    async get<T>(path: string, params?: ApiParams): Promise<TypedResponse<T>> {
        const encodedParams = new URLSearchParams()
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
                    encodedParams.set(key, val)
                }
            })
        }

        return handleRequest({
            axios: this.axios,
            config: {
                method: 'GET',
                url: `/api/method/${path}`,
                params: encodedParams,
            },
            errorMessage: 'There was an error while making the GET request.',
            transformResponse: (data: { data: TypedResponse<T> }) => data.data,
        })
    }

    /**
     * Makes a POST request to a Frappe API endpoint.
     *
     * @template T - Type of the response data
     * @param path - API endpoint path
     * @param params - Request body data
     * @returns Promise resolving to the response data
     * @throws {Error} If the request fails
     *
     * @example
     * ```typescript
     * // Simple POST request
     * const result = await call.post('frappe.handler', {
     *   data: { key: 'value' }
     * });
     *
     * // POST request with typed response
     * interface LoginResponse {
     *   token: string;
     *   user: User;
     * }
     * const login = await call.post<LoginResponse>('login', {
     *   usr: 'admin',
     *   pwd: 'password'
     * });
     * ```
     */
    async post<T>(path: string, params?: ApiParams): Promise<TypedResponse<T>> {
        return handleRequest({
            axios: this.axios,
            config: {
                method: 'POST',
                url: `/api/method/${path}`,
                data: params,
            },
            errorMessage: 'There was an error while making the POST request.',
            transformResponse: (data: { data: TypedResponse<T> }) => data.data,
        })
    }

    /**
     * Makes a PUT request to a Frappe API endpoint.
     *
     * @template T - Type of the response data
     * @param path - API endpoint path
     * @param params - Request body data
     * @returns Promise resolving to the response data
     * @throws {Error} If the request fails
     *
     * @example
     * ```typescript
     * // Update user preferences
     * const result = await call.put('frappe.user.update_prefs', {
     *   user: 'admin',
     *   preferences: {
     *     theme: 'dark'
     *   }
     * });
     * ```
     */
    async put<T>(path: string, params?: ApiParams): Promise<TypedResponse<T>> {
        return handleRequest({
            axios: this.axios,
            config: {
                method: 'PUT',
                url: `/api/method/${path}`,
                data: params,
            },
            errorMessage: 'There was an error while making the PUT request.',
            transformResponse: (data: { data: TypedResponse<T> }) => data.data,
        })
    }

    /**
     * Makes a DELETE request to a Frappe API endpoint.
     *
     * @template T - Type of the response data
     * @param path - API endpoint path
     * @param params - Query parameters
     * @returns Promise resolving to the response data
     * @throws {Error} If the request fails
     *
     * @example
     * ```typescript
     * // Delete a temporary file
     * await call.delete('frappe.handler.delete_file', {
     *   filename: 'temp.txt'
     * });
     * ```
     */
    async delete<T>(path: string, params?: ApiParams): Promise<TypedResponse<T>> {
        return handleRequest({
            axios: this.axios,
            config: {
                method: 'DELETE',
                url: `/api/method/${path}`,
                params,
            },
            errorMessage: 'There was an error while making the DELETE request.',
            transformResponse: (data: { data: TypedResponse<T> }) => data.data,
        })
    }
}
