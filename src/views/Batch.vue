<template>
  <div class="batch-page">
    <el-alert v-if="userRole === 'MANAGER'" title="您当前为运营经理角色，台账数据为只读模式" type="info" show-icon :closable="false" style="margin-bottom:16px" />

    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable>
            <el-option label="活跃" value="ACTIVE" />
            <el-option label="已出栏" value="HARVESTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="fetchBatches">搜索</el-button>
          <el-button type="success" icon="el-icon-plus" @click="createVisible = true" v-if="canWrite">新建批次</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top:16px" v-loading="loading">
      <el-table :data="batchList" stripe style="width:100%">
        <el-table-column prop="batchId" label="批次号" min-width="140">
          <template slot-scope="{ row }">
            <el-link type="primary" @click="$router.push('/batch-detail/' + row.id)">{{ row.batchId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="speciesName" label="品种" min-width="80" />
        <el-table-column prop="tankId" label="水池ID" min-width="70" />
        <el-table-column prop="initialCount" label="入池尾数" min-width="90" />
        <el-table-column prop="currentCount" label="当前尾数" min-width="90" />
        <el-table-column prop="totalFeedKg" label="饲料(kg)" min-width="90" />
        <el-table-column prop="fcr" label="FCR" min-width="70">
          <template slot-scope="{ row }">
            <span :style="{ color: row.fcr > 1.5 ? '#F56C6C' : '#67C23A' }">{{ row.fcr || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="80">
          <template slot-scope="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">{{ row.status === 'ACTIVE' ? '活跃' : '已出栏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="280" v-if="canWrite">
          <template slot-scope="{ row }">
            <template v-if="row.status === 'ACTIVE'">
              <el-button-group>
                <el-button size="mini" icon="el-icon-food" @click="showFeedDialog(row)">投喂</el-button>
                <el-button size="mini" icon="el-icon-warning-outline" type="warning" @click="showMortalityDialog(row)">死鱼</el-button>
                <el-button size="mini" icon="el-icon-first-aid-kit" type="danger" @click="showMedicationDialog(row)">用药</el-button>
                <el-button size="mini" icon="el-icon-truck" type="success" @click="showHarvestDialog(row)">出栏</el-button>
              </el-button-group>
            </template>
            <template v-else>
              <el-button size="mini" icon="el-icon-download" type="primary" @click="handleExport(row)">导出报表</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:16px;text-align:right" :current-page="page" :page-size="size" :total="total" @current-change="handlePageChange" layout="total, prev, pager, next" />
    </el-card>

    <!-- 新建批次 -->
    <el-dialog title="新建养殖批次" :visible.sync="createVisible" width="500px" @open="fetchIdleTanks">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="水池">
          <el-select v-model="createForm.tankId" placeholder="选择空闲水池" style="width:100%">
            <el-option v-for="t in idleTanks" :key="t.id" :label="t.tankName + ' (' + t.tankCode + ')'" :value="t.id" />
          </el-select>
          <p style="font-size:12px;color:#999;margin-top:4px" v-if="idleTanks.length === 0">暂无空闲水池，请先新增水池</p>
        </el-form-item>
        <el-form-item label="品种"><el-input v-model="createForm.speciesName" placeholder="如: 黄条鰤" /></el-form-item>
        <el-form-item label="入池尾数"><el-input-number v-model="createForm.initialCount" :min="1" /></el-form-item>
        <el-form-item label="入池均重(g)"><el-input-number v-model="createForm.initialAvgWeight" :min="0.1" :precision="1" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="createForm.supplier" /></el-form-item>
        <el-form-item label="检疫证号"><el-input v-model="createForm.quarantineCert" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitLoading">确认创建</el-button>
      </span>
    </el-dialog>

    <!-- 投喂 -->
    <el-dialog title="录入投喂" :visible.sync="feedVisible" width="400px">
      <el-form :model="feedForm" label-width="80px">
        <el-form-item label="饲料(kg)"><el-input-number v-model="feedForm.feedWeightKg" :min="0.1" :precision="2" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="feedForm.feedType" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="feedVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeed" :loading="submitLoading">确认</el-button>
      </span>
    </el-dialog>

    <!-- 死鱼 -->
    <el-dialog title="录入死鱼捞取" :visible.sync="mortalityVisible" width="400px">
      <el-form :model="mortalityForm" label-width="80px">
        <el-form-item label="死亡数量"><el-input-number v-model="mortalityForm.deathCount" :min="1" /></el-form-item>
        <el-form-item label="死因">
          <el-select v-model="mortalityForm.deathCause">
            <el-option label="缺氧" value="HYPOXIA" /><el-option label="机械损伤" value="MECHANICAL" />
            <el-option label="病害" value="DISEASE" /><el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="mortalityVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMortality" :loading="submitLoading">确认</el-button>
      </span>
    </el-dialog>

    <!-- 用药 -->
    <el-dialog title="录入用药" :visible.sync="medicationVisible" width="400px">
      <el-form :model="medicationForm" label-width="90px">
        <el-form-item label="药物名称"><el-input v-model="medicationForm.drugName" /></el-form-item>
        <el-form-item label="用量"><el-input v-model="medicationForm.dosage" /></el-form-item>
        <el-form-item label="休药期(天)"><el-input-number v-model="medicationForm.withdrawalDays" :min="1" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="medicationVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMedication" :loading="submitLoading">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listBatches, createBatch, addFeedRecord, addMortalityRecord, addMedicationRecord, harvestBatch, exportBatchReport } from "../api/modules/batch";
import { get } from "../api/axios";

export default {
  name: "Batch",
  props: { userRole: { type: String, default: "TECHNICIAN" } },
  computed: { canWrite() { return this.userRole === "ADMIN" || this.userRole === "TECHNICIAN"; } },
  data() {
    return {
      loading: false, submitLoading: false,
      filter: { status: "" },
      page: 1, size: 10, total: 0,
      batchList: [],
      idleTanks: [],
      createVisible: false, feedVisible: false, mortalityVisible: false, medicationVisible: false,
      currentBatch: null,
      createForm: { tankId: 1, speciesName: "", initialCount: 5000, initialAvgWeight: 50, supplier: "", quarantineCert: "" },
      feedForm: { feedWeightKg: 10, feedType: "" },
      mortalityForm: { deathCount: 1, deathCause: "OTHER" },
      medicationForm: { drugName: "", dosage: "", withdrawalDays: 7 },
    };
  },
  created() { this.fetchBatches(); },
  methods: {
    async fetchIdleTanks() {
      try {
        const res = await get("/tank/list", { status: "IDLE" });
        this.idleTanks = res.data || [];
      } catch (e) { this.idleTanks = []; }
    },
    async fetchBatches() {
      this.loading = true;
      try {
        const params = { page: this.page, size: this.size };
        if (this.filter.status) params.status = this.filter.status;
        const res = await listBatches(params);
        const pageData = res.data;
        this.batchList = pageData.records || [];
        this.total = pageData.total || 0;
      } catch (e) { this.$message.error("获取批次失败"); }
      finally { this.loading = false; }
    },
    handlePageChange(p) { this.page = p; this.fetchBatches(); },
    showFeedDialog(row) { this.currentBatch = row; this.feedVisible = true; },
    showMortalityDialog(row) { this.currentBatch = row; this.mortalityVisible = true; },
    showMedicationDialog(row) { this.currentBatch = row; this.medicationVisible = true; },
    showHarvestDialog(row) {
      this.$prompt("请输入出栏总重(kg)", "出栏结算", { inputPattern: /^\d+(\.\d+)?$/, inputErrorMessage: "请输入数字" }).then(async ({ value }) => {
        try {
          await harvestBatch(row.id, value);
          this.$message.success("出栏成功");
          this.fetchBatches();
        } catch (e) { this.$message.error(e.message || "出栏失败"); }
      }).catch(() => { /* 用户点了取消 */ });
    },
    async submitCreate() {
      this.submitLoading = true;
      try {
        await createBatch(this.createForm);
        this.$message.success("批次创建成功");
        this.createVisible = false;
        this.fetchBatches();
      } catch (e) { this.$message.error(e.message || "创建失败"); }
      finally { this.submitLoading = false; }
    },
    async submitFeed() {
      this.submitLoading = true;
      try {
        await addFeedRecord({ batchId: this.currentBatch.id, ...this.feedForm });
        this.$message.success("投喂记录已保存");
        this.feedVisible = false;
        this.fetchBatches();
      } catch (e) { this.$message.error(e.message || "保存失败"); }
      finally { this.submitLoading = false; }
    },
    async submitMortality() {
      this.submitLoading = true;
      try {
        await addMortalityRecord({ batchId: this.currentBatch.id, ...this.mortalityForm });
        this.$message.success("死亡记录已保存");
        this.mortalityVisible = false;
        this.fetchBatches();
      } catch (e) { this.$message.error(e.message || "保存失败"); }
      finally { this.submitLoading = false; }
    },
    async submitMedication() {
      this.submitLoading = true;
      try {
        await addMedicationRecord({ batchId: this.currentBatch.id, ...this.medicationForm });
        this.$message.success("用药记录已保存");
        this.medicationVisible = false;
        this.fetchBatches();
      } catch (e) { this.$message.error(e.message || "保存失败"); }
      finally { this.submitLoading = false; }
    },
    async handleExport(row) {
      try {
        const blob = await exportBatchReport(row.id);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `batch_report_${row.batchId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        this.$message.success("报表导出成功");
      } catch (e) {
        this.$message.error("导出失败: " + (e.message || "请检查后端服务"));
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.filter-card { border-radius: 8px; }
::v-deep .el-table {
  .el-table__row {
    height: 56px;
  }
  .el-button-group {
    display: flex;
    flex-wrap: nowrap;
    .el-button {
      padding: 5px 10px;
      font-size: 12px;
    }
  }
}
::v-deep .el-tag {
  margin-right: 4px;
}
</style>
