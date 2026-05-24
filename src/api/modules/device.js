/**
 * 设备管理模块 API - 负责人: 黄舰
 */
import { get, post, put, del } from "../axios";

// 注册设备
export function registerDevice(data) {
  return post("/device/register", data);
}

// 设备列表
export function listDevices(params) {
  return get("/device/list", params);
}

// 设备详情
export function getDeviceDetail(id) {
  return get(`/device/${id}`);
}

// 绑定水池
export function bindDeviceTank(id, tankId) {
  return put(`/device/${id}/bindTank`, null, { params: { tankId } });
}

// 删除设备
export function removeDevice(id) {
  return del(`/device/${id}`);
}

// 下发控制指令
export function sendCommand(data) {
  return post("/device/command", data);
}

// 查询指令状态
export function getCommandStatus(commandId) {
  return get(`/device/command/${commandId}/status`);
}
