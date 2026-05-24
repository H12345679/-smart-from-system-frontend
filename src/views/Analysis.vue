<template>
  <div class="analysis-page">
    <el-row :gutter="16">
      <!-- FCR 对比柱状图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-s-data"></i> 各批次 FCR 对比</span>
          </div>
          <div ref="fcrChart" style="width:100%;height:300px"></div>
        </el-card>
      </el-col>
      <!-- 死亡原因分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-pie-chart"></i> 死亡原因分布</span>
          </div>
          <div ref="deathPieChart" style="width:100%;height:300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <!-- 每日投喂量趋势 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-data-line"></i> 近7日投喂量趋势</span>
          </div>
          <div ref="feedTrendChart" style="width:100%;height:300px"></div>
        </el-card>
      </el-col>
      <!-- 水质综合评分 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-magic-stick"></i> 各池水质综合评分</span>
          </div>
          <div ref="radarChart" style="width:100%;height:300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <!-- 存活率趋势 -->
      <el-col :span="24">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-s-marketing"></i> 各批次存活率对比</span>
          </div>
          <div ref="survivalChart" style="width:100%;height:280px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { listBatches } from "../api/modules/batch";
import { getDashboard } from "../api/modules/monitor";

export default {
  name: "Analysis",
  data() {
    return { batches: [], tanks: [] };
  },
  async mounted() {
    await this.fetchData();
    this.$nextTick(() => {
      this.renderFcrChart();
      this.renderDeathPie();
      this.renderFeedTrend();
      this.renderRadar();
      this.renderSurvival();
    });
  },
  methods: {
    async fetchData() {
      try {
        const [batchRes, tankRes] = await Promise.all([
          listBatches({ page: 1, size: 20 }),
          getDashboard(),
        ]);
        this.batches = batchRes.data?.records || [];
        this.tanks = tankRes.data || [];
      } catch (e) { /* 静默 */ }
    },
    renderFcrChart() {
      const chart = this.$echarts.init(this.$refs.fcrChart);
      const batchesWithFcr = this.batches.filter(b => b.fcr);
      chart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: "5%", right: "5%", bottom: "15%", containLabel: true },
        xAxis: { type: "category", data: batchesWithFcr.map(b => b.batchId), axisLabel: { rotate: 20, fontSize: 11 } },
        yAxis: { type: "value", name: "FCR", min: 0, max: 2.5 },
        series: [{
          type: "bar", barWidth: "50%",
          data: batchesWithFcr.map(b => ({
            value: b.fcr,
            itemStyle: { color: b.fcr > 1.5 ? "#F56C6C" : b.fcr > 1.3 ? "#E6A23C" : "#67C23A" },
          })),
          markLine: { data: [{ yAxis: 1.3, label: { formatter: "优秀线1.3" }, lineStyle: { color: "#67C23A", type: "dashed" } }] },
        }],
      });
      window.addEventListener("resize", () => chart.resize());
    },
    renderDeathPie() {
      const chart = this.$echarts.init(this.$refs.deathPieChart);
      // 模拟死因分布数据
      chart.setOption({
        tooltip: { trigger: "item" },
        legend: { bottom: "5%" },
        series: [{
          type: "pie", radius: ["35%", "60%"],
          data: [
            { value: 45, name: "缺氧", itemStyle: { color: "#F56C6C" } },
            { value: 18, name: "机械损伤", itemStyle: { color: "#E6A23C" } },
            { value: 25, name: "病害", itemStyle: { color: "#909399" } },
            { value: 12, name: "其他", itemStyle: { color: "#c0c4cc" } },
          ],
          label: { formatter: "{b}: {d}%" },
        }],
      });
      window.addEventListener("resize", () => chart.resize());
    },
    renderFeedTrend() {
      const chart = this.$echarts.init(this.$refs.feedTrendChart);
      const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["1号池", "2号池", "3号池"] },
        grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
        xAxis: { type: "category", data: days },
        yAxis: { type: "value", name: "kg" },
        series: [
          { name: "1号池", type: "line", smooth: true, data: [52, 54, 51, 53, 55, 50, 53] },
          { name: "2号池", type: "line", smooth: true, data: [45, 44, 46, 43, 47, 45, 44] },
          { name: "3号池", type: "line", smooth: true, data: [38, 40, 39, 41, 38, 40, 39] },
        ],
      });
      window.addEventListener("resize", () => chart.resize());
    },
    renderRadar() {
      const chart = this.$echarts.init(this.$refs.radarChart);
      // 取前6个水池做雷达图
      const poolNames = this.tanks.slice(0, 6).map(t => t.tankName);
      chart.setOption({
        tooltip: {},
        radar: {
          indicator: [
            { name: "DO", max: 10 }, { name: "pH", max: 9 },
            { name: "温度适宜度", max: 10 }, { name: "氨氮安全", max: 10 },
          ],
        },
        series: [{
          type: "radar",
          data: this.tanks.slice(0, 3).map((t, i) => ({
            name: t.tankName,
            value: [t.do, t.ph, 10 - Math.abs(t.temp - 20), 10 - (Math.random() * 3)],
          })),
        }],
      });
      window.addEventListener("resize", () => chart.resize());
    },
    renderSurvival() {
      const chart = this.$echarts.init(this.$refs.survivalChart);
      const activeBatches = this.batches.filter(b => b.status === "ACTIVE" && b.initialCount > 0);
      chart.setOption({
        tooltip: { trigger: "axis", formatter: (p) => p.map(i => `${i.seriesName}: ${i.value}%`).join("<br>") },
        grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
        xAxis: { type: "category", data: activeBatches.map(b => b.batchId) },
        yAxis: { type: "value", name: "存活率(%)", min: 80, max: 100 },
        series: [{
          type: "bar", barWidth: "40%",
          data: activeBatches.map(b => ({
            value: ((b.currentCount / b.initialCount) * 100).toFixed(1),
            itemStyle: { color: (b.currentCount / b.initialCount) > 0.95 ? "#67C23A" : "#E6A23C" },
          })),
          markLine: { data: [{ yAxis: 95, label: { formatter: "优秀线95%" }, lineStyle: { color: "#67C23A", type: "dashed" } }] },
        }],
      });
      window.addEventListener("resize", () => chart.resize());
    },
  },
};
</script>

<style lang="scss" scoped>
.chart-card { border-radius: 10px; }
.card-header { font-weight: 500; i { margin-right: 6px; color: #409EFF; } }
</style>
