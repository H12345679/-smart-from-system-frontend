import axios from "axios";
import { getStore, removestore } from "../libs/storage.js";
import router from "../router";

// 创建axios实例
const service = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  timeout: 15000,
});

// 请求拦截器 - 自动携带JWT Token
service.interceptors.request.use(
  (config) => {
    const token = getStore("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理响应
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 后端统一响应体: { code, message, data, timestamp }
    if (res.code === 200) {
      return res;
    }
    // 401: Token过期或未登录
    if (res.code === 401) {
      removestore("token");
      removestore("userInfo");
      router.push("/login");
      return Promise.reject(new Error(res.message || "请重新登录"));
    }
    // 403: 权限不足
    if (res.code === 403) {
      return Promise.reject(new Error(res.message || "权限不足"));
    }
    // 其他错误
    return Promise.reject(new Error(res.message || "操作失败"));
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      removestore("token");
      removestore("userInfo");
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

// ========== 封装请求方法 ==========

export function get(url, params) {
  return service({ method: "get", url, params });
}

export function post(url, data) {
  return service({ method: "post", url, data });
}

export function put(url, data) {
  return service({ method: "put", url, data });
}

export function del(url, data) {
  return service({ method: "delete", url, data });
}

export default service;
