/**
 * router/index.js 路由守卫 单元测试
 *
 * 测试路由守卫的鉴权逻辑：
 * - 有Token时正常放行
 * - 无Token时跳转登录页
 * - 登录页和Trace页无需Token
 */

// Mock 依赖
jest.mock("@/libs/storage", () => ({
  getStore: jest.fn(),
  setStore: jest.fn(),
  removestore: jest.fn(),
}));

import { getStore } from "@/libs/storage";

describe("router - 路由守卫", () => {
  let router;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // 重新加载路由模块
    router = require("@/router").default;
  });

  // ==================== 路由配置完整性测试 ====================

  describe("路由配置", () => {
    test("应包含登录路由 /login", () => {
      const loginRoute = router.options.routes.find((r) => r.path === "/login");
      expect(loginRoute).toBeDefined();
      expect(loginRoute.name).toBe("Login");
    });

    test("应包含溯源路由 /trace", () => {
      const traceRoute = router.options.routes.find((r) => r.path === "/trace");
      expect(traceRoute).toBeDefined();
      expect(traceRoute.name).toBe("Trace");
    });

    test("根路径 / 应重定向到 /dashboard", () => {
      const rootRoute = router.options.routes.find((r) => r.path === "/");
      expect(rootRoute).toBeDefined();
      expect(rootRoute.redirect).toBe("/dashboard");
    });

    test("应包含所有业务子路由", () => {
      const rootRoute = router.options.routes.find((r) => r.path === "/");
      const childPaths = rootRoute.children.map((c) => c.path);

      expect(childPaths).toContain("dashboard");
      expect(childPaths).toContain("device");
      expect(childPaths).toContain("batch");
      expect(childPaths).toContain("alert");
      expect(childPaths).toContain("rule");
      expect(childPaths).toContain("user");
      expect(childPaths).toContain("settings");
      expect(childPaths).toContain("analysis");
      expect(childPaths).toContain("fish-status");
      expect(childPaths).toContain("business");
      expect(childPaths).toContain("audit");
    });

    test("批次详情路由应包含动态参数 :id", () => {
      const rootRoute = router.options.routes.find((r) => r.path === "/");
      const batchDetail = rootRoute.children.find(
        (c) => c.name === "BatchDetail"
      );
      expect(batchDetail).toBeDefined();
      expect(batchDetail.path).toBe("batch-detail/:id");
    });

    test("每个业务路由应有title和icon meta", () => {
      const rootRoute = router.options.routes.find((r) => r.path === "/");
      rootRoute.children.forEach((child) => {
        expect(child.meta).toBeDefined();
        expect(child.meta.title).toBeDefined();
        expect(child.meta.icon).toBeDefined();
      });
    });
  });

  // ==================== 路由守卫逻辑测试 ====================

  describe("路由守卫（beforeEach）", () => {
    let beforeEachGuard;

    beforeEach(() => {
      // 获取注册的 beforeEach 守卫
      // Vue Router 的 beforeEach 钩子保存在 router.beforeHooks 中
      beforeEachGuard = router.beforeHooks[0];
      expect(beforeEachGuard).toBeDefined();
    });

    test("访问/login时直接放行，不检查Token", () => {
      const to = { path: "/login" };
      const from = { path: "/" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(next).toHaveBeenCalledWith();
      expect(getStore).not.toHaveBeenCalled();
    });

    test("访问/trace时直接放行，不检查Token", () => {
      const to = { path: "/trace" };
      const from = { path: "/" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(next).toHaveBeenCalledWith();
      expect(getStore).not.toHaveBeenCalled();
    });

    test("有Token时正常放行", () => {
      getStore.mockReturnValue("valid-jwt-token");

      const to = { path: "/dashboard" };
      const from = { path: "/" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(getStore).toHaveBeenCalledWith("token");
      expect(next).toHaveBeenCalledWith();
    });

    test("无Token时跳转到/login", () => {
      getStore.mockReturnValue(null);

      const to = { path: "/dashboard" };
      const from = { path: "/" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(getStore).toHaveBeenCalledWith("token");
      expect(next).toHaveBeenCalledWith("/login");
    });

    test("Token为空字符串时跳转到/login", () => {
      getStore.mockReturnValue("");

      const to = { path: "/device" };
      const from = { path: "/" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(next).toHaveBeenCalledWith("/login");
    });

    test("访问嵌套路由/batch时需要Token验证", () => {
      getStore.mockReturnValue(null);

      const to = { path: "/batch" };
      const from = { path: "/" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(next).toHaveBeenCalledWith("/login");
    });

    test("访问设备管理路由有Token时放行", () => {
      getStore.mockReturnValue("token-123");

      const to = { path: "/device" };
      const from = { path: "/dashboard" };
      const next = jest.fn();

      beforeEachGuard(to, from, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  // ==================== 路由模式测试 ====================

  describe("路由模式", () => {
    test("应使用history模式", () => {
      expect(router.mode).toBe("history");
    });
  });
});
