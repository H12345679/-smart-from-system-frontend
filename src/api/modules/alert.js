/**
 * 报警管理模块 API - 负责人: 贾恩奇
 */
import { get, put } from "../axios";

// 报警历史列表
export function listAlerts(params) {
  return get("/alert/list", params);
}

// 活跃报警数量
export function getActiveAlertCount() {
  return get("/alert/active-count");
}

// 确认报警
export function acknowledgeAlert(id) {
  return put(`/alert/${id}/acknowledge`);
}

// 解除报警
export function resolveAlert(id) {
  return put(`/alert/${id}/resolve`);
}

// 升级报警
export function escalateAlert(id) {
  return put(`/alert/${id}/escalate`);
}

// 报警统计
export function getAlertStatistics() {
  return get("/alert/statistics");
}
