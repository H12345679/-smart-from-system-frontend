/**
 * WebSocket 连接管理器
 * 自动重连 + 心跳保活 + JWT 鉴权
 */
import { getStore } from "./storage";

class WsManager {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.baseUrl = "ws://localhost:8080/api/v1/ws/monitor";
  }

  // 建立连接时携带 JWT，未登录则不连接
  buildUrl() {
    const token = getStore("token");
    if (!token) return null;
    return `${this.baseUrl}?token=${encodeURIComponent(token)}`;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const url = this.buildUrl();
    if (!url) {
      console.warn("[WS] 未登录，跳过连接");
      return;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] 连接成功");
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach((fn) => fn(data));
      } catch (e) {
        // 非JSON消息忽略
      }
    };

    this.ws.onclose = () => {
      console.log("[WS] 连接关闭，30秒后重连");
      this.stopHeartbeat();
      this.reconnectTimer = setTimeout(() => this.connect(), 30000);
    };

    this.ws.onerror = () => {
      // 静默处理，不打印错误
      if (this.ws.readyState !== WebSocket.CLOSED) this.ws.close();
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 30000);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }

  onMessage(fn) {
    this.listeners.push(fn);
  }

  removeListener(fn) {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) this.ws.close();
  }
}

export default new WsManager();
