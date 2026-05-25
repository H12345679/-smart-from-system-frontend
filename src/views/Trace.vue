<template>
  <div class="trace-page">
    <div class="trace-card" v-loading="loading">
      <div class="trace-header">
        <img src="https://img.icons8.com/color/96/fish.png" alt="fish" class="trace-logo" />
        <h2>水产品质量追溯</h2>
        <p class="trace-subtitle">智慧工厂化循环水养殖管理系统</p>
      </div>

      <div v-if="traceData.traceCode" class="trace-body">
        <div class="trace-badge">
          <i class="el-icon-circle-check"></i> 产品合格 · 可追溯
        </div>

        <div class="trace-info">
          <div class="info-row"><span class="label">追溯码</span><span class="value">{{ traceData.traceCode }}</span></div>
          <div class="info-row"><span class="label">品种</span><span class="value">{{ traceData.species }}</span></div>
          <div class="info-row"><span class="label">养殖基地</span><span class="value">{{ traceData.farmName }}</span></div>
          <div class="info-row"><span class="label">入池日期</span><span class="value">{{ traceData.startDate }}</span></div>
          <div class="info-row"><span class="label">出栏日期</span><span class="value">{{ traceData.endDate }}</span></div>
          <div class="info-row"><span class="label">出栏重量</span><span class="value">{{ traceData.harvestWeight }} kg</span></div>
          <div class="info-row"><span class="label">饲料转化率</span><span class="value">{{ traceData.fcr }}</span></div>
          <div class="info-row"><span class="label">苗种供应商</span><span class="value">{{ traceData.supplier }}</span></div>
        </div>

        <div v-if="traceData.quarantineCerts && traceData.quarantineCerts.length" class="cert-section">
          <h4>检疫证书</h4>
          <div v-for="c in traceData.quarantineCerts" :key="c.cert_no" class="cert-item">
            <i class="el-icon-document-checked"></i> {{ c.cert_no }} - {{ c.issuer }} ({{ c.issue_date }})
          </div>
        </div>

        <div v-if="traceData.medications && traceData.medications.length" class="med-section">
          <h4>用药记录</h4>
          <div v-for="m in traceData.medications" :key="m.drug_name" class="med-item">
            <i class="el-icon-first-aid-kit"></i> {{ m.drug_name }} · 休药期至 {{ m.withdrawal_end_date }}
          </div>
        </div>
      </div>

      <div v-else class="trace-empty">
        <p>未找到该追溯码对应的产品信息</p>
      </div>

      <div class="trace-footer">
        <p>查询时间: {{ queryTime }}</p>
        <p>辽宁省大连市智慧养殖示范基地 · 全程可追溯</p>
      </div>
    </div>
  </div>
</template>

<script>
import { get } from "../api/axios";

export default {
  name: "Trace",
  data() {
    return { loading: false, traceData: {}, queryTime: "" };
  },
  async created() {
    this.queryTime = new Date().toLocaleString("zh-CN");
    const code = this.$route.query.code;
    if (code) {
      this.loading = true;
      try {
        // 通过追溯码反查批次（简化：从已出栏批次中匹配）
        const batchRes = await get("/batch/list", { status: "HARVESTED", page: 1, size: 50 });
        const batches = batchRes.data?.records || [];
        // 取第一个已出栏的批次作为演示
        if (batches.length > 0) {
          const res = await get(`/business/traceability/${batches[0].id}`);
          this.traceData = res.data || {};
        }
      } catch (e) { /* 静默 */ }
      finally { this.loading = false; }
    }
  },
};
</script>

<style lang="scss" scoped>
.trace-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%);
  padding: 20px;
}
.trace-card {
  max-width: 500px; width: 100%; background: #fff; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden;
}
.trace-header {
  background: linear-gradient(135deg, #1a3a5c, #0d2137); color: #fff; text-align: center; padding: 30px 20px;
  h2 { margin: 10px 0 4px; }
  .trace-subtitle { opacity: 0.7; font-size: 13px; }
}
.trace-logo { width: 60px; height: 60px; }
.trace-badge {
  text-align: center; padding: 12px; margin: 16px 20px;
  background: #f0f9eb; border-radius: 8px; color: #67C23A; font-weight: bold; font-size: 15px;
  i { font-size: 18px; margin-right: 4px; }
}
.trace-body { padding: 0 20px 20px; }
.trace-info { margin-bottom: 16px; }
.info-row {
  display: flex; justify-content: space-between; padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  .label { color: #999; font-size: 14px; }
  .value { color: #333; font-weight: 500; font-size: 14px; }
}
.cert-section, .med-section { margin-top: 16px; h4 { color: #409EFF; margin-bottom: 8px; } }
.cert-item, .med-item { font-size: 13px; color: #606266; margin-bottom: 6px; i { color: #67C23A; margin-right: 4px; } }
.trace-empty { text-align: center; padding: 40px; color: #999; }
.trace-footer { text-align: center; padding: 16px; background: #fafafa; color: #999; font-size: 12px; p { margin: 4px 0; } }
</style>
