/**
 * storage.js 工具函数 单元测试
 *
 * 测试 setStore / getStore / removestore 的功能
 */
import { setStore, getStore, removestore } from "@/libs/storage";

describe("storage.js - localStorage 工具函数", () => {
  beforeEach(() => {
    // 每个测试前清除 localStorage
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  // ==================== setStore 测试 ====================

  describe("setStore", () => {
    test("应将字符串值存入localStorage，key自动大写", () => {
      setStore("token", "abc123");
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "TOKEN",
        "abc123"
      );
    });

    test("应将对象值JSON序列化后存入localStorage", () => {
      const userInfo = { id: 1, name: "admin" };
      setStore("userInfo", userInfo);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "USERINFO",
        JSON.stringify(userInfo)
      );
    });

    test("应将数字值JSON序列化后存入localStorage", () => {
      setStore("count", 42);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "COUNT",
        "42"
      );
    });

    test("name为空时不执行存储操作", () => {
      setStore("", "value");
      expect(window.localStorage.setItem).not.toHaveBeenCalled();

      setStore(null, "value");
      expect(window.localStorage.setItem).not.toHaveBeenCalled();

      setStore(undefined, "value");
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // ==================== getStore 测试 ====================

  describe("getStore", () => {
    test("应根据key（大写）获取localStorage中的值", () => {
      getStore("token");
      expect(window.localStorage.getItem).toHaveBeenCalledWith("TOKEN");
    });

    test("key自动大写转换", () => {
      getStore("userInfo");
      expect(window.localStorage.getItem).toHaveBeenCalledWith("USERINFO");
    });

    test("name为空时返回undefined", () => {
      const result = getStore("");
      expect(result).toBeUndefined();
      expect(window.localStorage.getItem).not.toHaveBeenCalled();
    });

    test("name为null时返回undefined", () => {
      const result = getStore(null);
      expect(result).toBeUndefined();
    });
  });

  // ==================== removestore 测试 ====================

  describe("removestore", () => {
    test("应根据key（大写）删除localStorage中的值", () => {
      removestore("token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("TOKEN");
    });

    test("key自动大写转换", () => {
      removestore("userInfo");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("USERINFO");
    });

    test("name为空时不执行删除操作", () => {
      removestore("");
      expect(window.localStorage.removeItem).not.toHaveBeenCalled();

      removestore(null);
      expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  // ==================== 集成场景测试 ====================

  describe("完整存取删流程", () => {
    test("set → get → remove 完整流程", () => {
      setStore("token", "jwt-abc-123");
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "TOKEN",
        "jwt-abc-123"
      );

      getStore("token");
      expect(window.localStorage.getItem).toHaveBeenCalledWith("TOKEN");

      removestore("token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("TOKEN");
    });
  });
});
