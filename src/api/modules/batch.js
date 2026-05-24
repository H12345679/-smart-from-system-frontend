/**
 * 养殖台账模块 API - 负责人: 陈闯
 */
import { get, post, put } from "../axios";

// 创建批次
export function createBatch(data) {
  return post("/batch/create", data);
}

// 批次列表
export function listBatches(params) {
  return get("/batch/list", params);
}

// 批次详情
export function getBatchDetail(id) {
  return get(`/batch/${id}`);
}

// 出栏结算
export function harvestBatch(id, harvestWeightKg) {
  return put(`/batch/${id}/harvest?harvestWeightKg=${harvestWeightKg}`);
}

// 录入投喂
export function addFeedRecord(data) {
  return post("/batch/feed", data);
}

// 投喂历史
export function listFeedRecords(batchId) {
  return get(`/batch/${batchId}/feed-records`);
}

// 录入死亡
export function addMortalityRecord(data) {
  return post("/batch/mortality", data);
}

// 录入用药
export function addMedicationRecord(data) {
  return post("/batch/medication", data);
}

// 检查休药期
export function checkWithdrawalStatus(batchId) {
  return get(`/batch/${batchId}/withdrawal-status`);
}

// 导出报表（下载Excel文件 — 绕过响应拦截器）
export function exportBatchReport(batchId) {
  const token = localStorage.getItem("TOKEN");
  return fetch(`http://localhost:8080/api/v1/batch/${batchId}/export`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => {
    if (!res.ok) throw new Error("导出失败");
    return res.blob();
  });
}
