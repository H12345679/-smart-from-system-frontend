/**
 * 规则引擎模块 API - 负责人: 黄舰
 */
import { get, post, put, del } from "../axios";

// 创建规则
export function createRule(data) {
  return post("/rule/create", data);
}

// 规则列表
export function listRules(params) {
  return get("/rule/list", params);
}

// 更新规则
export function updateRule(id, data) {
  return put(`/rule/${id}`, data);
}

// 启用/禁用规则
export function toggleRule(id, enabled) {
  return put(`/rule/${id}/toggle?enabled=${enabled}`);
}

// 删除规则
export function deleteRule(id) {
  return del(`/rule/${id}`);
}

// 冲突检测
export function checkConflict(data) {
  return post("/rule/conflict-check", data);
}
