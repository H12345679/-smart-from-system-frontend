/**
 * 实时监控模块 API - 负责人: 贾恩奇
 */
import { get, put } from "../axios";

// 获取驾驶舱数据
export function getDashboard() {
  return get("/monitor/dashboard");
}

// 获取单池实时数据
export function getTankRealtime(tankId) {
  return get(`/monitor/tank/${tankId}/realtime`);
}

// 获取历史趋势
export function getTankHistory(tankId, params) {
  return get(`/monitor/tank/${tankId}/history`, params);
}

// 多参数对比
export function compareMetrics(params) {
  return get("/monitor/compare", params);
}

// 阈值配置列表
export function listThresholds() {
  return get("/monitor/thresholds");
}

// 更新阈值
export function updateThreshold(id, data) {
  return put(`/monitor/thresholds/${id}`, data);
}
