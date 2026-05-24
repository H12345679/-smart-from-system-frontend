<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-blue"><i class="el-icon-s-grid"></i></div>
          <div class="stat-info">
            <p class="stat-value">{{ tankList.length }}</p>
            <p class="stat-label">水池总数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-green"><i class="el-icon-connection"></i></div>
          <div class="stat-info">
            <p class="stat-value">{{ onlineCount }}</p>
            <p class="stat-label">在线设备</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon bg-orange"><i class="el-icon-document"></i></div>
          <div class="stat-info">
            <p class="stat-value">{{ activeBatches }}</p>
            <p class="stat-label">活跃批次</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" :class="{ 'alert-pulse': alertCount > 0 }">
          <div class="stat-icon bg-red"><i class="el-icon-bell"></i></div>
          <div class="stat-info">
            <p class="stat-value">{{ alertCount }}</p>
            <p class="stat-label">活跃报警</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 主体区域：水池网格 + 右侧面板 -->
    <el-row :gutter="16">
      <!-- 左侧：水池卡片网格 -->
      <el-col :span="16">
        <el-card class="section-card">
          <div slot="header" class="section-header">
            <span><i class="el-icon-monitor"></i> 水池实时监控</span>
            <el-tag type="success" size="mini" effect="dark">实时</el-tag>
          </div>
          <el-row :gutter="12" v-loading="loading">
            <el-col :span="8" v-for="tank in tankList" :key="tank.id">
              <div class="tank-card" :class="{ 'tank-alert': tank.hasAlert }" @click="showTankDetail(tank)">
                <div class="tank-header">
                  <span class="tank-name">{{ tank.tankName }}</span>
                  <el-tag :type="tank.hasAlert ? 'danger' : 'success'" size="mini" effect="dark">
                    {{ tank.hasAlert ? '异常' : '正常' }}
                  </el-tag>
                </div>
                <div class="tank-metrics">
                  <div class="metric">
                    <span class="metric-value" :class="{'danger': tank.do < 6}">{{ tank.do }}</span>
                    <span class="metric-unit">mg/L</span>
                    <span class="metric-label">DO</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">{{ tank.ph }}</span>
                    <span class="metric-unit"></span>
                    <span class="metric-label">pH</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">{{ tank.temp }}</span>
                    <span class="metric-unit">℃</span>
                    <span class="metric-label">温度</span>
                  </div>
                </div>
                <div class="tank-footer">
                  <span class="status-dot" :class="tank.hasAlert ? 'red' : 'green'"></span>
                  <span class="update-time">{{ tank.tankType === 'BREEDING' ? '养成池' : tank.tankType === 'FILTER' ? '过滤池' : '育苗池' }}</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧面板 -->
      <el-col :span="8">
        <!-- 环境参数仪表盘 -->
        <el-card class="section-card gauge-card">
          <div slot="header" class="section-header">
            <span><i class="el-icon-data-line"></i> 全场平均指标</span>
          </div>
          <div class="gauge-row">
            <div class="gauge-item">
              <div ref="doGauge" style="width:100%;height:120px"></div>
              <p class="gauge-label">溶解氧</p>
            </div>
            <div class="gauge-item">
              <div ref="phGauge" style="width:100%;height:120px"></div>
              <p class="gauge-label">pH</p>
            </div>
            <div class="gauge-item">
              <div ref="tempGauge" style="width:100%;height:120px"></div>
              <p class="gauge-label">温度</p>
            </div>
          </div>
        </el-card>

        <!-- 最近报警 -->
        <el-card class="section-card" style="margin-top:12px">
          <div slot="header" class="section-header">
            <span><i class="el-icon-warning"></i> 最近报警</span>
            <el-link type="primary" @click="$router.push('/alert')">查看全部</el-link>
          </div>
          <div v-if="recentAlerts.length === 0" class="empty-text">暂无活跃报警</div>
          <div v-else class="alert-list">
            <div v-for="alert in recentAlerts" :key="alert.id" class="alert-item" :class="'level-' + alert.alertLevel">
              <div class="alert-badge">{{ alert.alertLevel }}级</div>
              <div class="alert-content">
                <p class="alert-msg">{{ alert.message }}</p>
                <p class="alert-time">{{ alert.createTime }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部图表区 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card class="section-card">
          <div slot="header" class="section-header">
            <span><i class="el-icon-s-data"></i> DO 趋势（全场平均）</span>
          </div>
          <div ref="doTrendChart" style="width:100%;height:250px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="section-card">
          <div slot="header" class="section-header">
            <span><i class="el-icon-pie-chart"></i> 水池状态分布</span>
          </div>
          <div ref="statusPieChart" style="width:100%;height:250px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 水池详情弹窗 -->
    <el-dialog :title="selectedTank ? selectedTank.tankName + ' - 详细监控' : ''" :visible.sync="dialogVisible" width="750px">
      <el-descriptions :column="3" border v-if="selectedTank" style="margin-bottom:16px">
        <el-descriptions-item label="DO">{{ selectedTank.do }} mg/L</el-descriptions-item>
        <el-descriptions-item label="pH">{{ selectedTank.ph }}</el-descriptions-item>
        <el-descriptions-item label="温度">{{ selectedTank.temp }} ℃</el-descriptions-item>
      </el-descriptions>
      <div ref="detailChart" style="width:100%;height:280px" v-loading="detailLoading"></div>
    </el-dialog>
  </div>
</template>

<script>
import { getDashboard, getTankHistory } from "../api/modules/monitor";
import { getActiveAlertCount, listAlerts } from "../api/modules/alert";
import { listDevices } from "../api/modules/device";
import { listBatches } from "../api/modules/batch";
import wsManager from "../libs/websocket";

export default {
  name: "Dashboard",
  data() {
    return {
      loading: false, detailLoading: false,
      onlineCount: 0, activeBatches: 0, alertCount: 0,
      dialogVisible: false, selectedTank: null,
      tankList: [], recentAlerts: [],
    };
  },
  mounted() {
    this.fetchAll();
    wsManager.onMessage(this.handleWsRefresh);
  },
  beforeDestroy() {
    wsManager.removeListener(this.handleWsRefresh);
  },
  methods: {
    handleWsRefresh(data) {
      if (data.type === "refresh" || data.type === "sensor") {
        this.fetchDashboard();
      }
      if (data.type === "alert") {
        this.alertCount++;
        this.fetchRecentAlerts();
      }
    },
    async fetchAll() {
      await this.fetchDashboard();
      this.fetchStats();
      this.fetchRecentAlerts();
    },
    async fetchDashboard() {
      this.loading = true;
      try {
        const res = await getDashboard();
        this.tankList = res.data || [];
        this.$nextTick(() => {
          this.initGauges();
          this.initDoTrend();
          this.initStatusPie();
        });
      } catch (e) { /* 静默 */ }
      finally { this.loading = false; }
    },
    async fetchStats() {
      try {
        const [alertRes, deviceRes, batchRes] = await Promise.all([
          getActiveAlertCount(),
          listDevices({ onlineStatus: 1, page: 1, size: 1 }),
          listBatches({ status: "ACTIVE", page: 1, size: 1 }),
        ]);
        this.alertCount = alertRes.data || 0;
        this.onlineCount = deviceRes.data?.total || 0;
        this.activeBatches = batchRes.data?.total || 0;
      } catch (e) { /* 静默 */ }
    },
    async fetchRecentAlerts() {
      try {
        const res = await listAlerts({ status: "ACTIVE", page: 1, size: 5 });
        this.recentAlerts = (res.data?.records || []).slice(0, 5);
      } catch (e) { /* 静默 */ }
    },
    initGauges() {
      if (!this.tankList.length) return;
      const avgDo = (this.tankList.reduce((s, t) => s + t.do, 0) / this.tankList.length).toFixed(1);
      const avgPh = (this.tankList.reduce((s, t) => s + t.ph, 0) / this.tankList.length).toFixed(1);
      const avgTemp = (this.tankList.reduce((s, t) => s + t.temp, 0) / this.tankList.length).toFixed(1);

      this.renderGauge(this.$refs.doGauge, avgDo, 12, "mg/L", avgDo >= 6 ? "#67C23A" : "#F56C6C");
      this.renderGauge(this.$refs.phGauge, avgPh, 14, "", "#409EFF");
      this.renderGauge(this.$refs.tempGauge, avgTemp, 35, "℃", avgTemp <= 22 ? "#67C23A" : "#E6A23C");
    },
    renderGauge(el, value, max, unit, color) {
      if (!el) return;
      const chart = this.$echarts.init(el);
      chart.setOption({
        series: [{
          type: "gauge", radius: "90%", startAngle: 200, endAngle: -20,
          min: 0, max: max,
          axisLine: { lineStyle: { width: 12, color: [[value / max, color], [1, "#eee"]] } },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { formatter: `{value}${unit}`, fontSize: 16, offsetCenter: [0, "0%"], color: color },
          data: [{ value: parseFloat(value) }],
        }],
      });
    },
    initDoTrend() {
      if (!this.$refs.doTrendChart || !this.tankList.length) return;
      const chart = this.$echarts.init(this.$refs.doTrendChart);
      // 用各水池当前DO值模拟趋势
      chart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: "5%", right: "5%", top: "10%", bottom: "10%", containLabel: true },
        xAxis: { type: "category", data: this.tankList.map(t => t.tankName), axisLabel: { rotate: 30, fontSize: 11 } },
        yAxis: { type: "value", name: "mg/L", min: 4, max: 10 },
        series: [{
          type: "line", smooth: true, symbol: "circle", symbolSize: 8,
          data: this.tankList.map(t => t.do),
          lineStyle: { color: "#409EFF", width: 3 },
          itemStyle: { color: "#409EFF" },
          areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(64,158,255,0.3)" }, { offset: 1, color: "rgba(64,158,255,0.02)" }] } },
          markLine: { data: [{ yAxis: 6.0, label: { formatter: "安全线", position: "end" }, lineStyle: { color: "#F56C6C", type: "dashed", width: 2 } }], silent: true },
        }],
      });
      window.addEventListener("resize", () => chart.resize());
    },
    initStatusPie() {
      if (!this.$refs.statusPieChart || !this.tankList.length) return;
      const chart = this.$echarts.init(this.$refs.statusPieChart);
      const normal = this.tankList.filter(t => !t.hasAlert).length;
      const alert = this.tankList.filter(t => t.hasAlert).length;
      chart.setOption({
        tooltip: { trigger: "item" },
        legend: { bottom: "5%", left: "center" },
        series: [{
          type: "pie", radius: ["40%", "65%"], center: ["50%", "45%"],
          avoidLabelOverlap: false, label: { show: true, formatter: "{b}: {c}" },
          data: [
            { value: normal, name: "正常", itemStyle: { color: "#67C23A" } },
            { value: alert, name: "异常", itemStyle: { color: "#F56C6C" } },
          ],
        }],
      });
      window.addEventListener("resize", () => chart.resize());
    },
    async showTankDetail(tank) {
      this.selectedTank = tank;
      this.dialogVisible = true;
      this.detailLoading = true;
      try {
        const res = await getTankHistory(tank.id, { parameterType: "DO", startTime: "2026-01-01", endTime: "2026-12-31" });
        const points = res.data || [];
        this.$nextTick(() => {
          const chart = this.$echarts.init(this.$refs.detailChart);
          chart.setOption({
            tooltip: { trigger: "axis" },
            legend: { data: ["DO"] },
            grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
            xAxis: { type: "category", data: points.map(p => p.time) },
            yAxis: { type: "value", name: "mg/L", min: 4, max: 10 },
            series: [{
              name: "DO", type: "line", smooth: true,
              data: points.map(p => p.value),
              lineStyle: { width: 2 },
              areaStyle: { color: "rgba(64,158,255,0.1)" },
              markLine: { data: [{ yAxis: 6.0, label: { formatter: "安全线 6.0" }, lineStyle: { color: "#F56C6C", type: "dashed" } }] },
            }],
          });
        });
      } catch (e) { this.$message.error("获取历史数据失败"); }
      finally { this.detailLoading = false; }
    },
  },
};
</script>

<style lang="scss" scoped>
.dashboard { padding: 0; }
.stats-row { margin-bottom: 16px; }
.stat-card {
  background: #fff; border-radius: 10px; padding: 20px; display: flex; align-items: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
  &.alert-pulse { animation: alertPulse 1.5s infinite; }
}
@keyframes alertPulse { 0%,100% { box-shadow: 0 2px 12px rgba(245,108,108,0.2); } 50% { box-shadow: 0 2px 20px rgba(245,108,108,0.5); } }
.stat-icon {
  width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px;
  i { font-size: 26px; color: #fff; }
  &.bg-blue { background: linear-gradient(135deg, #409EFF, #337ecc); }
  &.bg-green { background: linear-gradient(135deg, #67C23A, #4e9a2e); }
  &.bg-orange { background: linear-gradient(135deg, #E6A23C, #cf8e2e); }
  &.bg-red { background: linear-gradient(135deg, #F56C6C, #c0392b); }
}
.stat-value { font-size: 28px; font-weight: bold; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 2px; }

.section-card { border-radius: 10px; }
.section-header { display: flex; justify-content: space-between; align-items: center; font-weight: 500; i { margin-right: 6px; } }

.tank-card {
  background: #f8fafc; border-radius: 10px; padding: 14px; margin-bottom: 12px; cursor: pointer;
  transition: all 0.3s; border: 2px solid transparent;
  &:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
  &.tank-alert { border-color: #F56C6C; background: #FEF0F0; animation: pulse 2s infinite; }
}
@keyframes pulse { 0%,100% { border-color: #F56C6C; } 50% { border-color: #fab6b6; } }
.tank-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.tank-name { font-weight: 600; font-size: 13px; color: #303133; }
.tank-metrics { display: flex; justify-content: space-around; text-align: center; }
.metric {
  .metric-value { font-size: 20px; font-weight: bold; color: #303133; &.danger { color: #F56C6C; } }
  .metric-unit { font-size: 11px; color: #909399; margin-left: 2px; }
  .metric-label { display: block; font-size: 11px; color: #909399; margin-top: 2px; }
}
.tank-footer { display: flex; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #ebeef5; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; &.green { background: #67C23A; } &.red { background: #F56C6C; } }
.update-time { font-size: 11px; color: #c0c4cc; }

.gauge-card .gauge-row { display: flex; justify-content: space-around; }
.gauge-item { flex: 1; text-align: center; }
.gauge-label { font-size: 12px; color: #909399; margin-top: -8px; }

.alert-list { max-height: 240px; overflow-y: auto; }
.alert-item {
  display: flex; align-items: flex-start; padding: 10px; margin-bottom: 8px; border-radius: 8px; background: #fef0f0;
  &.level-3 { background: #fde2e2; }
  &.level-2 { background: #fdf6ec; }
  &.level-1 { background: #f4f4f5; }
}
.alert-badge {
  min-width: 36px; height: 22px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #fff;
  display: flex; align-items: center; justify-content: center; margin-right: 10px; background: #F56C6C;
  .level-2 & { background: #E6A23C; }
  .level-1 & { background: #909399; }
}
.alert-content { flex: 1; }
.alert-msg { font-size: 13px; color: #303133; margin: 0 0 2px; line-height: 1.4; }
.alert-time { font-size: 11px; color: #c0c4cc; margin: 0; }
.empty-text { text-align: center; color: #c0c4cc; padding: 30px 0; font-size: 13px; }
</style>
