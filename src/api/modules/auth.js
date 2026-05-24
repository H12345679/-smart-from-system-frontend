/**
 * 认证模块 API - 负责人: 陈闯
 */
import { get, post } from "../axios";

// 登录
export function login(data) {
  return post("/auth/login", data);
}

// 注册
export function register(data) {
  return post("/auth/register", data);
}

// 获取验证码
export function getCaptcha() {
  return get("/auth/captcha");
}

// 获取当前用户信息
export function getUserInfo() {
  return get("/auth/userinfo");
}
