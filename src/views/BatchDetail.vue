<template>
  <div class="batch-detail" v-loading="loading">
    <!-- 批次信息卡片 -->
    <el-card class="info-card">
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center">
        <span>批次信息: {{ batch.batchId }}</span>
        <el-button size="small" icon="el-icon-back" @click="$router.push('/batch')">返回列表</el-button>
      </div>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="批次号">{{ batch.batchId }}</el-descriptions-item>
        <el-descriptions-item label="品种">{{ batch.speciesName }}</el-descriptions-item>
        <el-descriptions-item label="水池ID">{{ batch.tankId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="batch.status === 'ACTIVE' ? 'success' : 'info'" size="small">{{ batch.status === 'ACTIVE' ? '活跃' : '已出栏' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入池日期">{{ batch.startDate }}</el-descriptions-item>
        <el-descriptions-item label="出栏日期">{{ batch.endDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="初始尾数">{{ batch.initialCount }}</el-descriptions-item>
        <el-descriptions-item label="当前尾数">{{ batch.currentCount }}</el-descriptions-item>
        <el-descriptions-item label="累计饲料(kg)">{{ batch.totalFeedKg }}</el-descriptions-item>
        <el-descriptions-item label="出栏重量(kg)">{{ batch.harvestWeightKg || '-' }}</el-descriptions-item>
        <el-descriptions-item label="FCR">
          <span :style="{ color: batch.fcr > 1.5 ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">{{ batch.fcr || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="供应商">{{ batch.supplier || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 操作时间线 -->
    <el-card style="margin-top:16px">
      <div slot="header"><span>操作历史时间线</span></div>
      <el-timeline v-if="timeline.length > 0">
        <el-timeline-item v-for="(item, idx) in timeline" :key="idx"
          :type="item.type" :icon="item.icon" :timestamp="item.time" placement="top">
          <el-card shadow="never" class="timeline-card">
            <h4>{{ item.title }}</h4>
            <p>{{ item.content }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无操作记录" />
    </el-card>
  </div>
</template>

<script>
import { getBatchDetail, listFeedRecords } from "../api/modules/batch";
import { get } from "../api/axios";

export default {
  name: "BatchDetail",
  data() {
    return {
      loading: false,
      batch: {},
      timeline: [],
    };
  },
  created() {
    this.fetchDetail();
  },
  methods: {
    async fetchDetail() {
      this.loading = true;
      const id = this.$route.params.id;
      try {
        const [batchRes, feedRes, mortalityRes, medRes] = await Promise.all([
          getBatchDetail(id),
          listFeedRecords(id),
          get(`/batch/${id}/mortality-records`).catch(() => ({ data: [] })),
          get(`/batch/${id}/medication-records`).catch(() => ({ data: [] })),
        ]);
        this.batch = batchRes.data || {};
        this.buildTimeline(feedRes.data || [], mortalityRes.data || [], medRes.data || []);
      } catch (e) {
        this.$message.error("获取批次详情失败");
      } finally {
        this.loading = false;
      }
    },
    buildTimeline(feedRecords, mortalityRecords, medRecords) {
      const items = [];
      // 入池事件
      items.push({
        time: this.batch.startDate,
        title: "入池",
        content: `品种: ${this.batch.speciesName}，入池 ${this.batch.initialCount} 尾`,
        type: "primary",
        icon: "el-icon-s-flag",
      });
      // 投喂记录
      feedRecords.forEach((r) => {
        items.push({
          time: r.feedTime,
          title: "投喂",
          content: `投喂 ${r.feedWeightKg} kg${r.feedType ? ' (' + r.feedType + ')' : ''}`,
          type: "success",
          icon: "el-icon-food",
        });
      });
      // 死亡记录
      mortalityRecords.forEach((r) => {
        const causeMap = { HYPOXIA: "缺氧", MECHANICAL: "机械损伤", DISEASE: "病害", OTHER: "其他" };
        items.push({
          time: r.recordTime,
          title: "死亡捞取",
          content: `死亡 ${r.deathCount} 尾，原因: ${causeMap[r.deathCause] || r.deathCause}${r.remark ? '，' + r.remark : ''}`,
          type: "danger",
          icon: "el-icon-warning",
        });
      });
      // 用药记录
      medRecords.forEach((r) => {
        items.push({
          time: r.medicationTime,
          title: "用药",
          content: `${r.drugName}${r.dosage ? ' ' + r.dosage : ''}，休药期${r.withdrawalDays}天，至${r.withdrawalEndDate}`,
          type: "warning",
          icon: "el-icon-first-aid-kit",
        });
      });
      // 出栏事件
      if (this.batch.status === "HARVESTED") {
        items.push({
          time: this.batch.endDate,
          title: "出栏",
          content: `出栏重量: ${this.batch.harvestWeightKg} kg, FCR: ${this.batch.fcr}`,
          type: "warning",
          icon: "el-icon-truck",
        });
      }
      // 按时间倒序
      items.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
      this.timeline = items;
    },
  },
};
</script>

<style lang="scss" scoped>
.info-card { margin-bottom: 16px; }
.timeline-card {
  h4 { margin: 0 0 4px; font-size: 14px; }
  p { margin: 0; color: #666; font-size: 13px; }
}
</style>
