<template>
  <div class="alert-page">
    <el-row :gutter="16" class="alert-stats">
      <el-col :span="8">
        <div class="alert-stat-card level3"><h2>{{ level3Count }}</h2><p>3级致命报警</p></div>
      </el-col>
      <el-col :span="8">
        <div class="alert-stat-card level2"><h2>{{ level2Count }}</h2><p>2级严重预警</p></div>
      </el-col>
      <el-col :span="8">
        <div class="alert-stat-card level1"><h2>{{ level1Count }}</h2><p>1级轻微提示</p></div>
      </el-col>
    </el-row>

    <el-card style="margin-top:16px" v-loading="loading">
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center">
        <span>报警记录</span>
        <el-radio-group v-model="statusFilter" size="small" @change="fetchAlerts">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="ACTIVE">活跃</el-radio-button>
          <el-radio-button label="ACKNOWLEDGED">已确认</el-radio-button>
          <el-radio-button label="RESOLVED">已解除</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="alertList" stripe>
        <el-table-column label="级别" width="80">
          <template slot-scope="{ row }">
            <el-tag :type="row.alertLevel === 3 ? 'danger' : row.alertLevel === 2 ? 'warning' : 'info'" size="small">{{ row.alertLevel }}级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tankId" label="水池ID" width="80" />
        <el-table-column prop="parameterType" label="参数" width="80" />
        <el-table-column prop="message" label="报警信息" />
        <el-table-column prop="currentValue" label="当前值" width="90" />
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="触发时间" width="160" />
        <el-table-column label="操作" width="140">
          <template slot-scope="{ row }">
            <el-button size="mini" type="primary" v-if="row.status === 'ACTIVE'" @click="acknowledge(row)">确认</el-button>
            <el-button size="mini" type="success" v-if="row.status === 'ACKNOWLEDGED'" @click="resolve(row)">解除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:16px;text-align:right" :current-page="page" :page-size="size" :total="total" @current-change="handlePageChange" layout="total, prev, pager, next" />
    </el-card>
  </div>
</template>

<script>
import { listAlerts, getActiveAlertCount, acknowledgeAlert, resolveAlert } from "../api/modules/alert";

export default {
  name: "Alert",
  data() {
    return {
      loading: false, statusFilter: "",
      page: 1, size: 10, total: 0,
      alertList: [],
      level3Count: 0, level2Count: 0, level1Count: 0,
    };
  },
  created() { this.fetchAlerts(); this.fetchCounts(); },
  methods: {
    async fetchAlerts() {
      this.loading = true;
      try {
        const params = { page: this.page, size: this.size };
        if (this.statusFilter) params.status = this.statusFilter;
        const res = await listAlerts(params);
        const pageData = res.data;
        this.alertList = pageData.records || [];
        this.total = pageData.total || 0;
      } catch (e) { this.$message.error("获取报警列表失败"); }
      finally { this.loading = false; }
    },
    async fetchCounts() {
      try {
        // 分别查询各级别数量
        const [r3, r2, r1] = await Promise.all([
          listAlerts({ alertLevel: 3, status: "ACTIVE", page: 1, size: 1 }),
          listAlerts({ alertLevel: 2, status: "ACTIVE", page: 1, size: 1 }),
          listAlerts({ alertLevel: 1, status: "ACTIVE", page: 1, size: 1 }),
        ]);
        this.level3Count = r3.data?.total || 0;
        this.level2Count = r2.data?.total || 0;
        this.level1Count = r1.data?.total || 0;
      } catch (e) { /* 静默 */ }
    },
    handlePageChange(p) { this.page = p; this.fetchAlerts(); },
    statusType(s) { return { ACTIVE: "danger", ACKNOWLEDGED: "warning", ESCALATED: "danger", RESOLVED: "success" }[s] || "info"; },
    statusText(s) { return { ACTIVE: "活跃", ACKNOWLEDGED: "已确认", ESCALATED: "已升级", RESOLVED: "已解除" }[s] || s; },
    async acknowledge(row) {
      try {
        await acknowledgeAlert(row.id);
        this.$message.success("已确认");
        this.fetchAlerts();
        this.fetchCounts();
      } catch (e) { this.$message.error("操作失败"); }
    },
    async resolve(row) {
      try {
        await resolveAlert(row.id);
        this.$message.success("已解除");
        this.fetchAlerts();
        this.fetchCounts();
      } catch (e) { this.$message.error("操作失败"); }
    },
  },
};
</script>

<style lang="scss" scoped>
.alert-stats { margin-bottom: 8px; }
.alert-stat-card {
  border-radius: 8px; padding: 20px; text-align: center; color: #fff;
  h2 { font-size: 32px; margin-bottom: 4px; }
  p { font-size: 14px; opacity: 0.9; }
  &.level3 { background: linear-gradient(135deg, #F56C6C, #c0392b); }
  &.level2 { background: linear-gradient(135deg, #E6A23C, #d35400); }
  &.level1 { background: linear-gradient(135deg, #909399, #606266); }
}
</style>
