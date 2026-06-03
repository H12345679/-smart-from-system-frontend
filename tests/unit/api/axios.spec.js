/**
 * axios.js 封装 单元测试
 *
 * 测试请求拦截器（自动携带Token）、响应拦截器（状态码处理）、封装方法
 */
import axios from "axios";

// Mock 依赖
jest.mock("@/libs/storage", () => ({
  getStore: jest.fn(),
  removestore: jest.fn(),
}));

jest.mock("@/router", () => ({
  push: jest.fn(),
}));

import { getStore, removestore } from "@/libs/storage";
import router from "@/router";

// 用 axios.create 的 mock 来捕获拦截器
let requestInterceptor;
let responseInterceptor;
let mockAxiosInstance;

// 保存原始的 axios.create
const originalCreate = axios.create;

beforeAll(() => {
  // 拦截 axios.create 调用以捕获拦截器
  axios.create = jest.fn((config) => {
    mockAxiosInstance = jest.fn((reqConfig) => Promise.resolve({ data: reqConfig }));
    mockAxiosInstance.defaults = { baseURL: config.baseURL };
    mockAxiosInstance.interceptors = {
      request: {
        use: jest.fn((onFulfilled, onRejected) => {
          requestInterceptor = { onFulfilled, onRejected };
        }),
      },
      response: {
        use: jest.fn((onFulfilled, onRejected) => {
          responseInterceptor = { onFulfilled, onRejected };
        }),
      },
    };
    return mockAxiosInstance;
  });

  // 清除缓存的模块，重新加载以触发 axios.create
  jest.resetModules();
});

afterAll(() => {
  axios.create = originalCreate;
});

describe("axios.js - HTTP请求封装", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重新加载模块
    jest.resetModules();

    // 重新设置 mock
    axios.create = jest.fn((config) => {
      mockAxiosInstance = jest.fn((reqConfig) => Promise.resolve({ data: reqConfig }));
      mockAxiosInstance.defaults = { baseURL: config.baseURL };
      mockAxiosInstance.interceptors = {
        request: {
          use: jest.fn((onFulfilled, onRejected) => {
            requestInterceptor = { onFulfilled, onRejected };
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            responseInterceptor = { onFulfilled, onRejected };
          }),
        },
      };
      return mockAxiosInstance;
    });

    // 重新加载被测模块
    require("@/api/axios");
  });

  // ==================== 基础配置测试 ====================

  describe("基础配置", () => {
    test("axios.create 应以正确的baseURL和timeout被调用", () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://localhost:8080/api/v1",
          timeout: 15000,
        })
      );
    });

    test("应注册请求拦截器", () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(requestInterceptor).toBeDefined();
      expect(typeof requestInterceptor.onFulfilled).toBe("function");
    });

    test("应注册响应拦截器", () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      expect(responseInterceptor).toBeDefined();
      expect(typeof responseInterceptor.onFulfilled).toBe("function");
    });
  });

  // ==================== 请求拦截器测试 ====================

  describe("请求拦截器", () => {
    test("有Token时自动添加Authorization请求头", () => {
      getStore.mockReturnValue("jwt-test-token-123");

      const config = { headers: {} };
      const result = requestInterceptor.onFulfilled(config);

      expect(getStore).toHaveBeenCalledWith("token");
      expect(result.headers["Authorization"]).toBe("Bearer jwt-test-token-123");
    });

    test("无Token时不添加Authorization请求头", () => {
      getStore.mockReturnValue(null);

      const config = { headers: {} };
      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers["Authorization"]).toBeUndefined();
    });

    test("请求拦截器错误处理", async () => {
      const error = new Error("请求错误");

      await expect(requestInterceptor.onRejected(error)).rejects.toThrow("请求错误");
    });
  });

  // ==================== 响应拦截器测试 ====================

  describe("响应拦截器", () => {
    test("code=200 时返回响应数据", () => {
      const response = {
        data: { code: 200, message: "success", data: { id: 1 } },
      };

      const result = responseInterceptor.onFulfilled(response);

      expect(result).toEqual({ code: 200, message: "success", data: { id: 1 } });
    });

    test("code=401 时清除Token并跳转登录页", async () => {
      const response = {
        data: { code: 401, message: "Token过期" },
      };

      await expect(responseInterceptor.onFulfilled(response)).rejects.toThrow();
      expect(removestore).toHaveBeenCalledWith("token");
      expect(removestore).toHaveBeenCalledWith("userInfo");
      expect(router.push).toHaveBeenCalledWith("/login");
    });

    test("code=403 时抛出权限不足错误", async () => {
      const response = {
        data: { code: 403, message: "权限不足" },
      };

      await expect(responseInterceptor.onFulfilled(response)).rejects.toThrow("权限不足");
    });

    test("其他错误code抛出错误", async () => {
      const response = {
        data: { code: 500, message: "服务器内部错误" },
      };

      await expect(responseInterceptor.onFulfilled(response)).rejects.toThrow("服务器内部错误");
    });

    test("其他错误code无message时使用默认消息", async () => {
      const response = {
        data: { code: 500 },
      };

      await expect(responseInterceptor.onFulfilled(response)).rejects.toThrow("操作失败");
    });

    test("HTTP层面401错误 - 清除Token跳转登录", async () => {
      const error = {
        response: { status: 401 },
      };

      await expect(responseInterceptor.onRejected(error)).rejects.toBe(error);
      expect(removestore).toHaveBeenCalledWith("token");
      expect(removestore).toHaveBeenCalledWith("userInfo");
      expect(router.push).toHaveBeenCalledWith("/login");
    });

    test("网络错误（无response）应reject", async () => {
      const error = new Error("Network Error");

      await expect(responseInterceptor.onRejected(error)).rejects.toThrow("Network Error");
    });
  });
});
