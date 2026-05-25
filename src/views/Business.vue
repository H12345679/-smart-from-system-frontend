<template>
  <div class="business-page">
    <el-tabs v-model="activeTab" type="border-card">

      <!-- ===== 成本核算与利润预测 ===== -->
      <el-tab-pane label="成本与利润" name="profit">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="hover">
              <div slot="header"><i class="el-icon-coin"></i> 选择批次</div>
              <el-select v-model="selectedBatchId" placeholder="选择批次" style="width:100%" @change="fetchCostAndProfit">
                <el-option v-for="b in batches" :key="b.id" :label="b.batchId + ' - ' + b.speciesName" :value="b.id" />
              </el-select>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" v-loading="costLoading">
              <div slot="header"><i class="el-icon-money"></i> 成本汇总</div>
              <div v-if="costData.TOTAL" class="cost-list">
                <p>饲料: <strong>¥{{ costData.FEED || 0 }}</strong></p>
                <p>电费: <strong>¥{{ costData.ELECTRICITY || 0 }}</strong></p>
                <p>药品: <strong>¥{{ costData.MEDICINE || 0 }}</strong></p>
                <p>人工: <strong>¥{{ costData.LABOR || 0 }}</strong></p>
                <el-divider />
                <p class="total">总计: <strong style="color:#F56C6C;font-size:20px">¥{{ costData.TOTAL }}</strong></p>
                <p v-if="costData.costPerKg">单位成本: ¥{{ costData.costPerKg }}/kg</p>
              </div>
              <el-empty v-else description="选择批次查看" :image-size="60" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" v-loading="profitLoading">
              <div slot="header"><i class="el-icon-data-analysis"></i> 利润预测</div>
              <div v-if="profitData.estimatedProfit !== undefined" class="profit-info">
                <p>当前市场价: <strong>¥{{ profitData.marketPrice }}/kg</strong></p>
                <p>预估出栏重: <strong>{{ profitData.estimatedWeightKg }}kg</strong></p>
                <p>预估营收: <strong style="color:#409EFF">¥{{ profitData.estimatedRevenue }}</strong></p>
                <el-divider />
                <p class="profit-num">预估利润:
                  <strong :style="{color: profitData.estimatedProfit > 0 ? '#67C23A' : '#F56C6C', fontSize:'22px'}">
                    ¥{{ profitData.estimatedProfit }}
                  </strong>
                </p>
                <p>利润率: {{ profitData.profitMargin }}</p>
              </div>
              <el-empty v-else description="选择批次查看" :image-size="60" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- ===== 饲料库存 ===== -->
      <el-tab-pane label="饲料库存" name="inventory">
        <el-table :data="inventoryList" stripe v-loading="invLoading" style="width:100%">
          <el-table-column prop="feed_name" label="饲料名称" min-width="140" />
          <el-table-column prop="feed_type" label="类型" width="100" />
          <el-table-column prop="stock_kg" label="库存(kg)" width="100">
            <template slot-scope="{ row }">
              <span :style="{color: row.is_warning ? '#F56C6C' : '#333', fontWeight:'bold'}">{{ row.stock_kg }}</span>
              <el-tag v-if="row.is_warning" type="danger" size="mini" style="margin-left:4px">低</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="unit_price" label="单价(元/kg)" width="110" />
          <el-table-column prop="supplier" label="供应商" min-width="130" />
          <el-table-column label="操作" width="160">
            <template slot-scope="{ row }">
              <el-button size="mini" type="success" @click="feedAction(row, 'IN')">入库</el-button>
              <el-button size="mini" type="warning" @click="feedAction(row, 'OUT')">出库</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 市场行情 ===== -->
      <el-tab-pane label="市场行情" name="market">
        <div ref="marketChart" style="width:100%;height:350px" v-loading="marketLoading"></div>
      </el-tab-pane>

      <!-- ===== 投喂策略 ===== -->
      <el-tab-pane label="投喂策略" name="strategy">
        <el-form inline style="margin-bottom:16px">
          <el-form-item label="批次">
            <el-select v-model="strategyBatchId" @change="fetchStrategy" placeholder="选择批次">
              <el-option v-for="b in activeBatches" :key="b.id" :label="b.batchId" :value="b.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-card v-if="strategy.recommendedDailyKg" shadow="never" class="strategy-card">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前存活尾数">{{ strategy.currentCount }}</el-descriptions-item>
            <el-descriptions-item label="估算均重">{{ strategy.estimatedAvgWeightG }} g</el-descriptions-item>
            <el-descriptions-item label="总生物量">{{ strategy.totalBiomassKg }} kg</el-descriptions-item>
            <el-descriptions-item label="投喂率">{{ strategy.feedRate }}</el-descriptions-item>
          </el-descriptions>
          <el-alert :title="strategy.suggestion" type="success" show-icon style="margin-top:16px;font-size:16px" :closable="false" />
          <p style="margin-top:12px;color:#666">建议分 <strong>{{ strategy.mealsPerDay }}</strong> 餐投喂，每餐 <strong>{{ strategy.perMealKg }} kg</strong></p>
        </el-card>
      </el-tab-pane>

      <!-- ===== 出栏预测 ===== -->
      <el-tab-pane label="出栏预测" name="harvest">
        <el-form inline style="margin-bottom:16px">
          <el-form-item label="批次">
            <el-select v-model="harvestBatchId" @change="fetchHarvestPredict" placeholder="选择批次">
              <el-option v-for="b in activeBatches" :key="b.id" :label="b.batchId" :value="b.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-card v-if="harvestPredict.predictedHarvestDate" shadow="never">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前均重">{{ harvestPredict.currentAvgWeightG }} g</el-descriptions-item>
            <el-descriptions-item label="目标体重">{{ harvestPredict.targetWeightG }} g</el-descriptions-item>
            <el-descriptions-item label="日增重">{{ harvestPredict.growthRateGPerDay }} g/天</el-descriptions-item>
            <el-descriptions-item label="剩余天数">{{ harvestPredict.remainingDays }} 天</el-descriptions-item>
          </el-descriptions>
          <el-alert :title="harvestPredict.message" :type="harvestPredict.ready ? 'success' : 'info'" show-icon style="margin-top:16px;font-size:15px" :closable="false" />
        </el-card>
      </el-tab-pane>

      <!-- ===== 追溯码 ===== -->
      <el-tab-pane label="追溯码" name="trace">
        <el-form inline style="margin-bottom:16px">
          <el-form-item label="已出栏批次">
            <el-select v-model="traceBatchId" @change="fetchTrace" placeholder="选择已出栏批次">
              <el-option v-for="b in harvestedBatches" :key="b.id" :label="b.batchId + ' - ' + b.speciesName" :value="b.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-card v-if="traceData.traceCode" shadow="never">
          <el-row :gutter="24">
            <el-col :span="16">
              <el-descriptions :column="2" border title="产品追溯信息">
                <el-descriptions-item label="追溯码">{{ traceData.traceCode }}</el-descriptions-item>
                <el-descriptions-item label="品种">{{ traceData.species }}</el-descriptions-item>
                <el-descriptions-item label="养殖基地">{{ traceData.farmName }}</el-descriptions-item>
                <el-descriptions-item label="入池日期">{{ traceData.startDate }}</el-descriptions-item>
                <el-descriptions-item label="出栏日期">{{ traceData.endDate }}</el-descriptions-item>
                <el-descriptions-item label="出栏重量">{{ traceData.harvestWeight }} kg</el-descriptions-item>
                <el-descriptions-item label="FCR">{{ traceData.fcr }}</el-descriptions-item>
                <el-descriptions-item label="供应商">{{ traceData.supplier }}</el-descriptions-item>
              </el-descriptions>
              <div v-if="traceData.quarantineCerts && traceData.quarantineCerts.length" style="margin-top:12px">
                <h4 style="color:#409EFF">检疫证书</h4>
                <el-tag v-for="c in traceData.quarantineCerts" :key="c.cert_no" style="margin-right:8px">{{ c.cert_no }} ({{ c.issuer }})</el-tag>
              </div>
            </el-col>
            <el-col :span="8" style="text-align:center">
              <div class="qr-container">
                <img :src="qrCodeUrl" v-if="qrCodeUrl" class="qr-image" />
                <p class="qr-url">{{ traceUrl }}</p>
                <p style="margin-top:4px;color:#999;font-size:12px">扫码或访问以上链接查看追溯信息</p>
                <el-button size="small" type="primary" icon="el-icon-download" @click="downloadQR" style="margin-top:8px">下载二维码</el-button>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>

      <!-- ===== 检疫证 ===== -->
      <el-tab-pane label="检疫证管理" name="quarantine">
        <el-button type="success" size="small" icon="el-icon-plus" style="margin-bottom:12px" @click="certDialogVisible = true">新增检疫证</el-button>
        <el-table :data="certList" stripe v-loading="certLoading" style="width:100%">
          <el-table-column prop="cert_no" label="证书编号" min-width="130" />
          <el-table-column prop="batch_code" label="批次号" width="130" />
          <el-table-column prop="species_name" label="品种" width="80" />
          <el-table-column prop="cert_type" label="类型" width="80">
            <template slot-scope="{ row }">
              <el-tag :type="row.cert_type === 'IMPORT' ? 'success' : 'warning'" size="small">{{ row.cert_type === 'IMPORT' ? '入场' : '出场' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="issuer" label="签发机构" min-width="150" />
          <el-table-column prop="issue_date" label="签发日期" width="110" />
          <el-table-column prop="valid_until" label="有效期至" width="110" />
          <el-table-column prop="status" label="状态" width="80">
            <template slot-scope="{ row }">
              <el-tag :type="row.status === 'VALID' ? 'success' : 'danger'" size="small">{{ row.status === 'VALID' ? '有效' : '过期' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-dialog title="新增检疫证" :visible.sync="certDialogVisible" width="500px">
          <el-form :model="certForm" label-width="90px">
            <el-form-item label="批次">
              <el-select v-model="certForm.batchId" style="width:100%">
                <el-option v-for="b in batches" :key="b.id" :label="b.batchId" :value="b.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="证书编号"><el-input v-model="certForm.certNo" /></el-form-item>
            <el-form-item label="签发机构"><el-input v-model="certForm.issuer" /></el-form-item>
            <el-form-item label="签发日期"><el-date-picker v-model="certForm.issueDate" type="date" value-format="yyyy-MM-dd" style="width:100%" /></el-form-item>
            <el-form-item label="有效期至"><el-date-picker v-model="certForm.validUntil" type="date" value-format="yyyy-MM-dd" style="width:100%" /></el-form-item>
            <el-form-item label="类型">
              <el-radio-group v-model="certForm.certType">
                <el-radio label="IMPORT">入场检疫</el-radio>
                <el-radio label="EXPORT">出场检疫</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <span slot="footer">
            <el-button @click="certDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitCert">确认</el-button>
          </span>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { get, post } from "../api/axios";
import { listBatches } from "../api/modules/batch";

export default {
  name: "Business",
  data() {
    return {
      activeTab: "profit",
      batches: [], activeBatches: [], harvestedBatches: [],
      // 成本利润
      selectedBatchId: null, costData: {}, profitData: {}, costLoading: false, profitLoading: false,
      // 库存
      inventoryList: [], invLoading: false,
      // 市场
      marketLoading: false,
      // 策略
      strategyBatchId: null, strategy: {},
      // 出栏
      harvestBatchId: null, harvestPredict: {},
      // 追溯
      traceBatchId: null, traceData: {}, qrCodeUrl: "", traceUrl: "",
      // 检疫
      certList: [], certLoading: false, certDialogVisible: false,
      certForm: { batchId: null, certNo: "", issuer: "", issueDate: "", validUntil: "", certType: "IMPORT" },
    };
  },
  async created() {
    await this.fetchBatches();
    this.fetchInventory();
    this.fetchCerts();
  },
  watch: {
    activeTab(val) {
      if (val === "market") this.$nextTick(() => this.fetchMarket());
    },
  },
  methods: {
    async fetchBatches() {
      try {
        const res = await listBatches({ page: 1, size: 50 });
        this.batches = res.data?.records || [];
        this.activeBatches = this.batches.filter(b => b.status === "ACTIVE");
        this.harvestedBatches = this.batches.filter(b => b.status === "HARVESTED");
      } catch (e) { /* 静默 */ }
    },
    async fetchCostAndProfit() {
      if (!this.selectedBatchId) return;
      this.costLoading = true; this.profitLoading = true;
      try {
        const [costRes, profitRes] = await Promise.all([
          get(`/business/cost/summary/${this.selectedBatchId}`),
          get(`/business/profit/predict/${this.selectedBatchId}`),
        ]);
        this.costData = costRes.data || {};
        this.profitData = profitRes.data || {};
      } catch (e) { this.$message.error("获取失败"); }
      finally { this.costLoading = false; this.profitLoading = false; }
    },
    async fetchInventory() {
      this.invLoading = true;
      try { const res = await get("/business/feed-inventory/list"); this.inventoryList = res.data || []; }
      catch (e) { /* 静默 */ } finally { this.invLoading = false; }
    },
    feedAction(row, type) {
      this.$prompt(`请输入${type === 'IN' ? '入' : '出'}库数量(kg)`, "饲料操作").then(async ({ value }) => {
        try {
          await post(`/business/feed-inventory/${type.toLowerCase()}`, { inventoryId: row.id, quantityKg: value });
          this.$message.success("操作成功");
          this.fetchInventory();
        } catch (e) { this.$message.error("操作失败"); }
      }).catch(() => {});
    },
    async fetchMarket() {
      this.marketLoading = true;
      try {
        const res = await get("/business/market/prices", { species: "黄条鰤" });
        const data = (res.data || []).reverse();
        const chart = this.$echarts.init(this.$refs.marketChart);
        chart.setOption({
          title: { text: "黄条鰤市场价格走势", left: "center" },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: data.map(d => d.price_date) },
          yAxis: { type: "value", name: "元/kg", min: 60, max: 75 },
          series: [{ type: "line", smooth: true, data: data.map(d => d.price_per_kg), areaStyle: { color: "rgba(64,158,255,0.1)" }, markLine: { data: [{ type: "average", name: "均价" }] } }],
        });
        window.addEventListener("resize", () => chart.resize());
      } catch (e) { /* 静默 */ } finally { this.marketLoading = false; }
    },
    async fetchStrategy() {
      if (!this.strategyBatchId) return;
      try { const res = await get(`/business/feed-strategy/${this.strategyBatchId}`); this.strategy = res.data || {}; }
      catch (e) { this.$message.error("获取策略失败"); }
    },
    async fetchHarvestPredict() {
      if (!this.harvestBatchId) return;
      try { const res = await get(`/business/harvest-predict/${this.harvestBatchId}`); this.harvestPredict = res.data || {}; }
      catch (e) { this.$message.error("获取预测失败"); }
    },
    async fetchTrace() {
      if (!this.traceBatchId) return;
      try {
        const res = await get(`/business/traceability/${this.traceBatchId}`);
        this.traceData = res.data || {};
        // 生成二维码 — 内容为本地追溯页面链接
        const QRCode = (await import("qrcode")).default;
        const traceUrl = `${window.location.origin}/trace?code=${this.traceData.traceCode}`;
        this.traceUrl = traceUrl;
        this.qrCodeUrl = await QRCode.toDataURL(traceUrl, { width: 200, margin: 2 });
      } catch (e) { this.$message.error("获取追溯信息失败"); }
    },
    downloadQR() {
      if (!this.qrCodeUrl) return;
      const link = document.createElement("a");
      link.href = this.qrCodeUrl;
      link.download = `trace_qr_${this.traceData.traceCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    async fetchCerts() {
      this.certLoading = true;
      try { const res = await get("/business/quarantine/list"); this.certList = res.data || []; }
      catch (e) { /* 静默 */ } finally { this.certLoading = false; }
    },
    async submitCert() {
      try {
        await post("/business/quarantine/add", this.certForm);
        this.$message.success("检疫证添加成功");
        this.certDialogVisible = false;
        this.fetchCerts();
      } catch (e) { this.$message.error("添加失败"); }
    },
  },
};
</script>

<style lang="scss" scoped>
.cost-list p { margin: 8px 0; color: #606266; }
.cost-list .total { font-size: 16px; }
.profit-info p { margin: 8px 0; color: #606266; }
.strategy-card { background: #f8fff8; }
.qr-container { padding: 20px; background: #fafafa; border-radius: 12px; display: inline-block; }
.qr-image { width: 180px; height: 180px; border: 2px solid #eee; border-radius: 8px; }
.qr-url { margin-top: 10px; font-size: 11px; color: #409EFF; word-break: break-all; line-height: 1.4; }
</style>
