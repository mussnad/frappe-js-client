/**
 * @module db
 * @description Provides database operations for Frappe documents.
 * This module handles CRUD operations, document listing, counting, and querying
 * with support for filtering, pagination, and sorting.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { FrappeApp } from '@frappe/sdk';
 *
 * const app = new FrappeApp('https://instance.example.com');
 * const db = app.db();
 *
 * // Get a document
 * const user = await db.getDoc('User', 'administrator');
 *
 * // Get a filtered list of documents
 * const tasks = await db.getDocList('Task', {
 *   filters: [['status', '=', 'Open']],
 *   orderBy: { field: 'creation', order: 'desc' }
 * });
 * ```
 */

import { AxiosInstance } from 'axios'

import { GetDocListArgs, GetLastDocArgs } from './types'
import { handleRequest } from '../utils/axios'
import { FrappeDoc } from '../frappe/types'

/**
 * Main class for database operations in Frappe.
 *
 * @class FrappeDB
 * @description Provides methods for interacting with Frappe's database,
 * including CRUD operations and document querying.
 *
 * @example
 * ```typescript
 * const db = new FrappeDB(
 *   'https://instance.example.com',
 *   axiosInstance,
 *   true,
 *   () => localStorage.getItem('token'),
 *   'Bearer'
 * );
 *
 * // Create a document
 * const newDoc = await db.createDoc('Task', {
 *   subject: 'New Task',
 *   status: 'Open'
 * });
 *
 * // Update a document
 * await db.updateDoc('Task', newDoc.name, {
 *   status: 'Completed'
 * });
 * ```
 */
export class FrappeDB {
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
     * Creates a new FrappeDB instance.
     *
     * @param appURL - Base URL of the Frappe instance
     * @param axios - Configured Axios instance for making requests
     * @param useToken - Whether to use token-based authentication
     * @param token - Function that returns the authentication token
     * @param tokenType - Type of token to use ('Bearer' or 'token')
     *
     * @example
     * ```typescript
     * const db = new FrappeDB(
     *   'https://instance.example.com',
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
     * Retrieves a document from the database.
     *
     * @template T - Type of the document
     * @param doctype - Name of the doctype
     * @param docname - Name/ID of the document
     * @returns Promise resolving to the document
     * @throws {FrappeError} If document retrieval fails
     *
     * @example
     * ```typescript
     * // Get a user document
     * const user = await db.getDoc<User>('User', 'administrator');
     * // Get a task document
     * const task = await db.getDoc('Task', 'TASK-001');
     * ```
     */
    getDoc<T extends FrappeDoc<object>>(doctype: string, docname = ''): Promise<T> {
        return handleRequest<{ data: T }, T>({
            axios: this.axios,
            config: {
                method: 'GET',
                url: `/api/resource/${doctype}/${encodeURIComponent(docname)}`,
            },
            errorMessage: 'There was an error while fetching the document.',
            transformResponse: (response: { data: T }) => response.data,
        })
    }

    /**
     * Retrieves a list of documents with filtering, sorting, and pagination.
     *
     * @template T - Type of the document
     * @template K - Type for filter fields
     * @param doctype - Name of the doctype
     * @param args - Query arguments for filtering, sorting, and pagination
     * @returns Promise resolving to an array of documents
     * @throws {FrappeError} If document retrieval fails
     *
     * @example
     * ```typescript
     * // Get all open tasks
     * const tasks = await db.getDocList('Task', {
     *   filters: [['status', '=', 'Open']],
     *   orderBy: { field: 'creation', order: 'desc' },
     *   limit: 10
     * });
     *
     * // Get specific user fields
     * const users = await db.getDocList<User>('User', {
     *   fields: ['name', 'email', 'first_name'],
     *   filters: [['user_type', '=', 'System User']]
     * });
     * ```
     */
    getDocList<T extends FrappeDoc<object>>(doctype: string, args?: GetDocListArgs<T>): Promise<T[]> {
        let params = {}

        if (args) {
            const { fields, filters, groupBy, orderBy, limit_start, limit, asDict = true, orFilters } = args
            const orderByString = orderBy ? `${String(orderBy?.field)} ${orderBy?.order ?? 'asc'}` : ''
            params = {
                fields: fields ? JSON.stringify(fields) : undefined,
                filters: filters ? JSON.stringify(filters) : undefined,
                group_by: groupBy,
                order_by: orderByString,
                limit_start,
                limit,
                as_dict: asDict,
                or_filters: orFilters ? JSON.stringify(orFilters) : undefined,
            }
        }

        return handleRequest<{ data: T[] }, T[]>({
            axios: this.axios,
            config: {
                method: 'GET',
                url: `/api/resource/${doctype}`,
                params,
            },
            errorMessage: 'There was an error while fetching the documents.',
            transformResponse: (response: { data: T[] }) => response.data,
        })
    }

    /**
     * Creates a new document in the database.
     *
     * @template T - Type of the document
     * @param doctype - Name of the doctype
     * @param value - Document data to create
     * @returns Promise resolving to the created document
     * @throws {FrappeError} If document creation fails
     *
     * @example
     * ```typescript
     * // Create a new task
     * const task = await db.createDoc('Task', {
     *   subject: 'New Task',
     *   description: 'Task description',
     *   status: 'Open'
     * });
     *
     * // Create a user
     * const user = await db.createDoc<User>('User', {
     *   email: 'john@example.com',
     *   first_name: 'John',
     *   user_type: 'System User'
     * });
     * ```
     */
    createDoc<T extends FrappeDoc<object>>(doctype: string, value: T): Promise<T> {
        return handleRequest<{ data: T }, T>({
            axios: this.axios,
            config: {
                method: 'POST',
                url: `/api/resource/${doctype}`,
                data: value,
            },
            errorMessage: 'There was an error while creating the document.',
            transformResponse: (response: { data: T }) => response.data,
        })
    }

    /**
     * Updates an existing document in the database.
     *
     * @template T - Type of the document
     * @param doctype - Name of the doctype
     * @param docname - Name/ID of the document to update
     * @param value - Partial document data to update
     * @returns Promise resolving to the updated document
     * @throws {FrappeError} If document update fails
     *
     * @example
     * ```typescript
     * // Update task status
     * await db.updateDoc('Task', 'TASK-001', {
     *   status: 'Completed',
     *   completion_date: new Date()
     * });
     *
     * // Update user settings
     * await db.updateDoc<User>('User', 'john@example.com', {
     *   language: 'en',
     *   time_zone: 'UTC'
     * });
     * ```
     */
    updateDoc<T extends FrappeDoc<object>>(doctype: string, docname: string | null, value: Partial<T>): Promise<T> {
        return handleRequest<{ data: T }, T>({
            axios: this.axios,
            config: {
                method: 'PUT',
                url: `/api/resource/${doctype}/${docname ? encodeURIComponent(docname) : docname}`,
                data: value,
            },
            errorMessage: 'There was an error while updating the document.',
            transformResponse: (response: { data: T }) => response.data,
        })
    }

    /**
     * Deletes a document from the database.
     *
     * @param doctype - Name of the doctype
     * @param docname - Name/ID of the document to delete
     * @returns Promise resolving to a success message
     * @throws {FrappeError} If document deletion fails
     *
     * @example
     * ```typescript
     * // Delete a task
     * await db.deleteDoc('Task', 'TASK-001');
     *
     * // Delete a user
     * await db.deleteDoc('User', 'john@example.com');
     * ```
     */
    deleteDoc(doctype: string, docname?: string | null): Promise<string> {
        return handleRequest<{ data: string }, string>({
            axios: this.axios,
            config: {
                method: 'DELETE',
                url: `/api/resource/${doctype}/${docname ? encodeURIComponent(docname) : docname}`,
            },
            errorMessage: 'There was an error while deleting the document.',
            transformResponse: (response: { data: string }) => response.data,
        })
    }

    /**
     * Gets the most recent document of a doctype matching the specified criteria.
     *
     * @template T - Type of the document
     * @param doctype - Name of the doctype
     * @param args - Optional query arguments
     * @returns Promise resolving to the last document
     * @throws {FrappeError} If document retrieval fails
     *
     * @example
     * ```typescript
     * // Get last created task
     * const lastTask = await db.getLastDoc('Task');
     *
     * // Get last completed task
     * const lastCompleted = await db.getLastDoc('Task', {
     *   filters: [['status', '=', 'Completed']],
     *   orderBy: { field: 'modified', order: 'desc' }
     * });
     * ```
     */
    async getLastDoc<T extends FrappeDoc<object>>(doctype: string, args?: GetLastDocArgs<T>): Promise<T> {
        let queryArgs: GetLastDocArgs<T> = {
            orderBy: {
                field: 'creation',
                order: 'desc',
            },
        }
        if (args) {
            queryArgs = {
                ...queryArgs,
                ...args,
            }
        }

        const getDocLists = await this.getDocList<T>(doctype, {
            ...queryArgs,
            limit: 1,
            fields: ['name'],
        })
        if (getDocLists.length > 0) {
            return this.getDoc<T>(doctype, getDocLists[0].name)
        }

        return {} as T
    }
}
