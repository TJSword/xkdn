/*
 * @Author: BoLin
 * @Date: 2022-05-21 12:04:43
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-25 17:28:46
 * @Description: file content
 * @FilePath: \digital-twin-system-framework\src\utils\http.ts
 */
import Qs from 'qs'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { loading } from '@/components/loading/index'
import type { AxiosRequestConfig, CustomParamsSerializer } from 'axios'
interface Option {
    repeatRequestCancel?: boolean
    loading?: boolean
    errorMessageShow?: boolean
    reductDataFormat?: boolean
}

// 全局loading
const LoadingInstance = {
    count: 0
}

/**
 * @param {*} config
 * @returns string
 * @description 生成每个请求唯一的键
 */
const getPendingKey = (config: AxiosRequestConfig) => {
    let { data } = config
    const { url, method, params } = config
    if (typeof data === 'string') {
        data = JSON.parse(data) // response里面返回的config.data是个字符串对象
    }
    return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}

/**
 * @param {*} config
 * @description 储存每个请求唯一值, 也就是cancel()方法, 用于取消请求
 */
// 缓存请求对象
const pendingMap = new Map()
const addPending = (config: AxiosRequestConfig) => {
    const pendingKey = getPendingKey(config)
    config.cancelToken =
        config.cancelToken ||
        new axios.CancelToken(cancel => {
            if (!pendingMap.has(pendingKey)) {
                pendingMap.set(pendingKey, cancel)
            }
        })
}

/**
 * @param {*} config
 * @description 取消重复请求并删除队列
 */
const removePending = (config: AxiosRequestConfig) => {
    const pendingKey = getPendingKey(config)
    if (pendingMap.has(pendingKey)) {
        const cancelToken = pendingMap.get(pendingKey)
        cancelToken(pendingKey)
        pendingMap.delete(pendingKey)
    }
}

/**
 * @param options
 * @description 关闭load
 */
const closeLoading = (options: Option) => {
    if (options.loading && LoadingInstance.count > 0) {
        LoadingInstance.count--
    }

    if (LoadingInstance.count === 0) {
        loading.hide()
    }
}

/**
 * @param error
 * @description 处理http请求异常
 */
const httpErrorHandle = (error: any) => {
    let message = ''
    // 处理被取消的请求
    if (axios.isCancel(error)) {
        return console.error('请求的重复请求：' + error.message)
    }

    if (error && error.response) {
        switch (error.response.status) {
            case 302:
                message = '接口重定向了！'
                break
            case 400:
                message = '参数不正确！'
                break
            case 401:
                message = '您未登录，或者登录已经超时，请先登录！'
                break
            case 403:
                message = '您没有权限操作！'
                break
            case 404:
                message = `请求地址出错: ${error.response.config.url}`
                break
            case 408:
                message = '请求超时！'
                break
            case 409:
                message = '系统已存在相同数据！'
                break
            case 500:
                message = '服务器内部错误！'
                break
            case 501:
                message = '服务未实现！'
                break
            case 502:
                message = '网关错误！'
                break
            case 503:
                message = '服务不可用！'
                break
            case 504:
                message = '服务暂时无法访问，请稍后再试！'
                break
            case 505:
                message = 'HTTP版本不受支持！'
                break
            default:
                message = '异常问题，请联系管理员！'
                break
        }
    }

    if (error.message.includes('timeout')) {
        message = '网络请求超时！'
    }

    if (error.message.includes('Network')) {
        message = window.navigator.onLine ? '服务端异常！' : '您断网了！'
    }

    ElMessage({
        message: message,
        type: 'error'
    })
}

/**
 * @param config axios配置对象
 * @param customOptions 配置自定义选项
 */
const createAxios = (axiosConfig: {}, customOptions: Option) => {
    const axiosInstance = axios.create({
        baseURL: '',
        timeout: 0,
        withCredentials: true
    })

    // 自定义配置
    const options: Option = Object.assign(
        {
            repeatRequestCancel: true, // 是否开启取消重复请求, 默认为 true
            loading: false, // 是否开启loading层效果, 默认为true
            errorMessageShow: true, // 是否展示接口错误信息, 默认为true
            reductDataFormat: true // 是否开启简洁的数据结构响应, 默认为true
        },
        customOptions
    )

    // 请求拦截器
    axiosInstance.interceptors.request.use(
        config => {
            removePending(config)
            options.repeatRequestCancel && addPending(config)

            // 请求头携带token
            const token = localStorage.getItem('xxl_sso_sessionid')
            if (typeof window !== 'undefined' && token) {
                config.headers['xxl_sso_sessionid'] = token
            }

            // 创建load实例
            if (options.loading) {
                LoadingInstance.count++
                if (LoadingInstance.count === 1) {
                    loading.show()
                }
            }
            return config
        },
        err => {
            return Promise.reject(err)
        }
    )

    // 响应拦截器
    axiosInstance.interceptors.response.use(
        response => {
            removePending(response.config)
            options.loading && closeLoading(options) // 关闭loading

            // sso没有登录, 需要跳转登录
            if (response.data.code == 501) {
                window.location.href = response.data.redirect
                return Promise.reject('sso没有登录!')
            }

            return options.reductDataFormat ? response.data : response
        },
        err => {
            err.config && removePending(err.config)
            options.loading && closeLoading(options) // 关闭loading
            options.errorMessageShow && httpErrorHandle(err) // 处理错误状态码
            return Promise.reject(err)
        }
    )

    return axiosInstance(axiosConfig)
}

// --------------------------------------------------------------- 封装常用请求 --------------------------------------------------------------- //
export const request = {
    get: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
        return new Promise(resolve => {
            const config = {
                method: 'get',
                paramsSerializer: function (params: CustomParamsSerializer) {
                    return Qs.stringify(params)
                },
                ...requestConfig
            }
            createAxios(config, { ...customOptions }).then(res => resolve(res))
        })
    },
    post: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
        return new Promise(resolve => {
            const config = {
                method: 'post',
                ...requestConfig
            }
            createAxios(config, { ...customOptions }).then(res => resolve(res))
        })
    },
    put: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
        return new Promise(resolve => {
            const config = {
                method: 'put',
                ...requestConfig
            }
            createAxios(config, { ...customOptions }).then(res => resolve(res))
        })
    },
    delete: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
        return new Promise(resolve => {
            const config = {
                method: 'delete',
                paramsSerializer: function (params: CustomParamsSerializer) {
                    return Qs.stringify(params)
                },
                ...requestConfig
            }
            createAxios(config, { ...customOptions }).then(res => resolve(res))
        })
    }
}
