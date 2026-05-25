<template>
  <div class="fish-status-page" v-loading="loading">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <div class="summary-card total"><h2>{{ overview.total }}</h2><p>监测中批次</p></div>
      </el-col>
      <el-col :span="6">
        <div class="summary-card healthy"><h2>{{ overview.healthy }}</h2><p>🐟 健康活跃</p></div>
      </el-col>
      <el-col :span="6">
        <div class="summary-card stressed"><h2>{{ overview.stressed }}</h2><p>⚠️ 轻度应激</p></div>
      </el-col>
      <el-col :span="6">
        <div class="summary-card danger"><h2>{{ overview.danger }}</h2><p>🚨 高度危险</p></div>
      </el-col>
    </el-row>

    <!-- 鱼群状态卡片 -->
    <el-row :gutter="16">
      <el-col :span="12" v-for="tank in tanks" :key="tank.tankId">
        <el-card class="fish-card" :class="'status-' + tank.status.toLowerCase()" shadow="hover">
          <!-- 头部 -->
          <div class="fish-card-header">
            <div class="fish-card-title">
              <span class="tank-label">{{ tank.tankName }}</span>
              <el-tag :color="tank.color" size="small" effect="dark" style="color:#fff;border:none">{{ tank.statusLabel }}</el-tag>
            </div>
            <div class="health-score">
              <div class="score-circle" :style="{ '--score-color': tank.color }">
                <span class="score-num">{{ tank.healthScore }}</span>
              </div>
              <span class="score-label">健康评分</span>
            </div>
          </div>

          <!-- 批次信息 -->
          <div class="batch-info">
            <span>{{ tank.batchId }} | {{ tank.speciesName }} | 存活 {{ tank.currentCount }} 尾</span>
          </div>

          <!-- 四维评分条 -->
          <div class="score-bars">
            <div class="bar-item">
              <span class="bar-label">DO ({{ tank.do }} mg/L)</span>
              <el-progress :percentage="tank.doScore" :color="getBarColor(tank.doScore)" :stroke-width="10" :show-text="false" />
            </div>
            <div class="bar-item">
              <span class="bar-label">pH ({{ tank.ph }})</span>
              <el-progress :percentage="tank.phScore" :color="getBarColor(tank.phScore)" :stroke-width="10" :show-text="false" />
            </div>
            <div class="bar-item">
              <span class="bar-label">温度 ({{ tank.temp }} ℃)</span>
              <el-progress :percentage="tank.tempScore" :color="getBarColor(tank.tempScore)" :stroke-width="10" :show-text="false" />
            </div>
            <div class="bar-item">
              <span class="bar-label">氨氮 ({{ tank.nh4 }} mg/L)</span>
              <el-progress :percentage="tank.nh4Score" :color="getBarColor(tank.nh4Score)" :stroke-width="10" :show-text="false" />
            </div>
          </div>

          <!-- 行为预测 -->
          <div class="behavior-section">
            <p class="behavior-title"><i class="el-icon-view"></i> 行为预测</p>
            <p class="behavior-text">{{ tank.behavior }}</p>
            <p class="feed-rate">预测采食率: <strong :style="{ color: tank.feedRatePredict > 70 ? '#67C23A' : '#F56C6C' }">{{ tank.feedRatePredict }}%</strong></p>
          </div>

          <!-- 养殖建议 -->
          <div class="suggestions">
            <p class="suggestion-title"><i class="el-icon-warning-outline"></i> 养殖建议</p>
            <ul>
              <li v-for="(s, i) in tank.suggestions" :key="i">{{ s }}</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { get } from "../api/axios";
import wsManager from "../libs/websocket";

export default {
  name: "FishStatus",
  data() {
    return {
      loading: false,
      overview: { total: 0, healthy: 0, stressed: 0, danger: 0 },
      tanks: [],
    };
  },
  mounted() {
    this.fetchData();
    wsManager.onMessage(this.handleRefresh);
    // 每15秒自动刷新
    this.timer = setInterval(this.fetchData, 15000);
  },
  beforeDestroy() {
    wsManager.removeListener(this.handleRefresh);
    clearInterval(this.timer);
  },
  methods: {
    handleRefresh(data) {
      if (data.type === "refresh") this.fetchData();
    },
    async fetchData() {
      try {
        const res = await get("/fish-status/overview");
        const data = res.data;
        this.overview = { total: data.total, healthy: data.healthy, stressed: data.stressed, danger: data.danger };
        this.tanks = data.tanks || [];
      } catch (e) { /* 静默 */ }
    },
    getBarColor(score) {
      if (score >= 80) return "#67C23A";
      if (score >= 60) return "#E6A23C";
      return "#F56C6C";
    },
  },
};
</script>

<style lang="scss" scoped>
.summary-row { margin-bottom: 16px; }
.summary-card {
  border-radius: 10px; padding: 20px; text-align: center; color: #fff;
  h2 { font-size: 36px; margin-bottom: 4px; }
  p { font-size: 14px; opacity: 0.9; }
  &.total { background: linear-gradient(135deg, #409EFF, #337ecc); }
  &.healthy { background: linear-gradient(135deg, #67C23A, #4e9a2e); }
  &.stressed { background: linear-gradient(135deg, #E6A23C, #cf8e2e); }
  &.danger { background: linear-gradient(135deg, #F56C6C, #c0392b); }
}

.fish-card {
  margin-bottom: 16px; border-radius: 12px; transition: all 0.3s;
  &.status-danger { border-left: 4px solid #F56C6C; }
  &.status-stressed { border-left: 4px solid #E6A23C; }
  &.status-healthy { border-left: 4px solid #67C23A; }
}
.fish-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.fish-card-title { display: flex; align-items: center; gap: 10px; }
.tank-label { font-size: 16px; font-weight: 600; color: #303133; }
.health-score { text-align: center; }
.score-circle {
  width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: 3px solid var(--score-color, #409EFF); margin: 0 auto;
}
.score-num { font-size: 18px; font-weight: bold; color: #303133; }
.score-label { font-size: 11px; color: #909399; }

.batch-info { font-size: 12px; color: #909399; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #eee; }

.score-bars { margin-bottom: 14px; }
.bar-item { margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.bar-label { font-size: 12px; color: #606266; min-width: 130px; }

.behavior-section { background: #f8fafc; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
.behavior-title { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 4px; i { color: #409EFF; } }
.behavior-text { font-size: 13px; color: #606266; margin: 0; }
.feed-rate { font-size: 12px; color: #909399; margin-top: 4px; }

.suggestions { background: #fef9f0; border-radius: 8px; padding: 10px 14px; }
.suggestion-title { font-size: 13px; font-weight: 600; color: #E6A23C; margin-bottom: 4px; }
.suggestions ul { margin: 0; padding-left: 16px; }
.suggestions li { font-size: 12px; color: #606266; line-height: 1.8; }
</style>
