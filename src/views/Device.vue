<template>
  <div class="device-page">
    <!-- Tab 切换：设备 / 水池 -->
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ========== 设备管理 Tab ========== -->
      <el-tab-pane label="设备管理" name="device">
        <el-form inline style="margin-bottom:12px">
          <el-form-item label="类型">
            <el-select v-model="filter.deviceType" placeholder="全部" clearable size="small">
              <el-option label="传感器" value="SENSOR" />
              <el-option label="执行器" value="ACTUATOR" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filter.onlineStatus" placeholder="全部" clearable size="small">
              <el-option label="在线" :value="1" />
              <el-option label="离线" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" icon="el-icon-search" @click="fetchDevices">搜索</el-button>
            <el-button type="success" size="small" icon="el-icon-plus" @click="registerVisible = true">注册设备</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="deviceList" stripe v-loading="loading" style="width:100%">
          <el-table-column prop="deviceName" label="设备名称" min-width="140" />
          <el-table-column prop="macAddress" label="MAC地址" min-width="140" />
          <el-table-column prop="deviceType" label="类型" width="90">
            <template slot-scope="{ row }">
              <el-tag :type="row.deviceType === 'SENSOR' ? 'info' : 'warning'" size="small">
                {{ row.deviceType === 'SENSOR' ? '传感器' : '执行器' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="parameterType" label="参数" width="80" />
          <el-table-column prop="tankId" label="水池ID" width="70" />
          <el-table-column label="状态" width="70">
            <template slot-scope="{ row }">
              <span :class="row.onlineStatus ? 'online' : 'offline'">{{ row.onlineStatus ? '在线' : '离线' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template slot-scope="{ row }">
              <el-button size="mini" type="primary" v-if="row.deviceType === 'ACTUATOR'" @click="controlDevice(row)" :loading="row._loading">控制</el-button>
              <el-button size="mini" type="danger" @click="removeDevice(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination style="margin-top:12px;text-align:right" :current-page="page" :page-size="size" :total="total" @current-change="handlePageChange" layout="total, prev, pager, next" />
      </el-tab-pane>

      <!-- ========== 水池管理 Tab ========== -->
      <el-tab-pane label="水池管理" name="tank">
        <el-form inline style="margin-bottom:12px">
          <el-form-item label="类型">
            <el-select v-model="tankFilter.tankType" placeholder="全部" clearable size="small">
              <el-option label="养成池" value="BREEDING" />
              <el-option label="过滤池" value="FILTER" />
              <el-option label="育苗池" value="NURSERY" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" icon="el-icon-search" @click="fetchTanks">搜索</el-button>
            <el-button type="success" size="small" icon="el-icon-plus" @click="tankCreateVisible = true">新增水池</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="tankList" stripe v-loading="tankLoading" style="width:100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="tankCode" label="编号" width="90" />
          <el-table-column prop="tankName" label="名称" min-width="120" />
          <el-table-column prop="tankType" label="类型" width="90">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="row.tankType === 'BREEDING' ? 'success' : row.tankType === 'FILTER' ? 'info' : 'warning'">
                {{ row.tankType === 'BREEDING' ? '养成池' : row.tankType === 'FILTER' ? '过滤池' : '育苗池' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="volumeM3" label="容积(m³)" width="90" />
          <el-table-column prop="status" label="状态" width="90">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="row.status === 'IDLE' ? 'success' : row.status === 'OCCUPIED' ? 'warning' : 'danger'">
                {{ row.status === 'IDLE' ? '空闲' : row.status === 'OCCUPIED' ? '使用中' : '维护' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template slot-scope="{ row }">
              <el-button size="mini" type="danger" @click="deleteTank(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 注册设备弹窗 -->
    <el-dialog title="注册新设备" :visible.sync="registerVisible" width="500px">
      <el-form :model="registerForm" label-width="100px">
        <el-form-item label="设备名称"><el-input v-model="registerForm.deviceName" /></el-form-item>
        <el-form-item label="MAC地址"><el-input v-model="registerForm.macAddress" placeholder="AA:BB:CC:DD:EE:FF" /></el-form-item>
        <el-form-item label="设备类型">
          <el-radio-group v-model="registerForm.deviceType">
            <el-radio label="SENSOR">传感器</el-radio>
            <el-radio label="ACTUATOR">执行器</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="监测参数" v-if="registerForm.deviceType === 'SENSOR'">
          <el-select v-model="registerForm.parameterType">
            <el-option label="DO" value="DO" /><el-option label="PH" value="PH" />
            <el-option label="TEMP" value="TEMP" /><el-option label="NH4" value="NH4" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定水池"><el-input-number v-model="registerForm.tankId" :min="1" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRegister" :loading="submitLoading">确认注册</el-button>
      </span>
    </el-dialog>

    <!-- 新增水池弹窗 -->
    <el-dialog title="新增水池" :visible.sync="tankCreateVisible" width="450px">
      <el-form :model="tankForm" label-width="80px">
        <el-form-item label="编号"><el-input v-model="tankForm.tankCode" placeholder="如: T-010" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="tankForm.tankName" placeholder="如: 10号养成池" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="tankForm.tankType">
            <el-option label="养成池" value="BREEDING" />
            <el-option label="过滤池" value="FILTER" />
            <el-option label="育苗池" value="NURSERY" />
          </el-select>
        </el-form-item>
        <el-form-item label="容积(m³)"><el-input-number v-model="tankForm.volumeM3" :min="1" :precision="2" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="tankCreateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTankCreate" :loading="tankSubmitLoading">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listDevices, registerDevice, sendCommand, removeDevice as apiRemoveDevice } from "../api/modules/device";
import { get, post, del } from "../api/axios";

export default {
  name: "Device",
  data() {
    return {
      activeTab: "device",
      // 设备
      loading: false, submitLoading: false, registerVisible: false,
      filter: { deviceType: "", onlineStatus: "" },
      page: 1, size: 10, total: 0,
      deviceList: [],
      registerForm: { deviceName: "", macAddress: "", deviceType: "SENSOR", parameterType: "DO", tankId: 1 },
      // 水池
      tankLoading: false, tankCreateVisible: false, tankSubmitLoading: false,
      tankFilter: { tankType: "" },
      tankList: [],
      tankForm: { tankCode: "", tankName: "", tankType: "BREEDING", volumeM3: 50 },
    };
  },
  created() { this.fetchDevices(); this.fetchTanks(); },
  methods: {
    // ===== 设备 =====
    async fetchDevices() {
      this.loading = true;
      try {
        const params = { page: this.page, size: this.size };
        if (this.filter.deviceType) params.deviceType = this.filter.deviceType;
        if (this.filter.onlineStatus !== "" && this.filter.onlineStatus !== null) params.onlineStatus = this.filter.onlineStatus;
        const res = await listDevices(params);
        const pageData = res.data;
        this.deviceList = (pageData.records || []).map(d => ({ ...d, _loading: false }));
        this.total = pageData.total || 0;
      } catch (e) { this.$message.error("获取设备列表失败"); }
      finally { this.loading = false; }
    },
    handlePageChange(p) { this.page = p; this.fetchDevices(); },
    async submitRegister() {
      this.submitLoading = true;
      try {
        await registerDevice(this.registerForm);
        this.$message.success("设备注册成功");
        this.registerVisible = false;
        this.fetchDevices();
      } catch (e) { this.$message.error(e.message || "注册失败"); }
      finally { this.submitLoading = false; }
    },
    async controlDevice(row) {
      row._loading = true;
      try {
        await sendCommand({ deviceId: row.id, action: "ON" });
        this.$message.success("指令已下发");
      } catch (e) { this.$message.error("指令下发失败"); }
      finally { row._loading = false; }
    },
    removeDevice(row) {
      this.$confirm(`确认删除 "${row.deviceName}"?`, "警告", { type: "warning" }).then(async () => {
        try {
          await apiRemoveDevice(row.id);
          this.$message.success("删除成功");
          this.fetchDevices();
        } catch (e) { this.$message.error("删除失败"); }
      }).catch(() => {});
    },
    // ===== 水池 =====
    async fetchTanks() {
      this.tankLoading = true;
      try {
        const params = {};
        if (this.tankFilter.tankType) params.tankType = this.tankFilter.tankType;
        const res = await get("/tank/list", params);
        this.tankList = res.data || [];
      } catch (e) { this.$message.error("获取水池列表失败"); }
      finally { this.tankLoading = false; }
    },
    async submitTankCreate() {
      if (!this.tankForm.tankCode || !this.tankForm.tankName) {
        this.$message.warning("请填写编号和名称");
        return;
      }
      this.tankSubmitLoading = true;
      try {
        await post("/tank/create", this.tankForm);
        this.$message.success("水池创建成功");
        this.tankCreateVisible = false;
        this.tankForm = { tankCode: "", tankName: "", tankType: "BREEDING", volumeM3: 50 };
        this.fetchTanks();
      } catch (e) { this.$message.error(e.message || "创建失败"); }
      finally { this.tankSubmitLoading = false; }
    },
    deleteTank(row) {
      this.$confirm(`确认删除水池 "${row.tankName}"?`, "警告", { type: "warning" }).then(async () => {
        try {
          await del(`/tank/${row.id}`);
          this.$message.success("删除成功");
          this.fetchTanks();
        } catch (e) { this.$message.error("删除失败"); }
      }).catch(() => {});
    },
  },
};
</script>

<style lang="scss" scoped>
.online { color: #67C23A; font-weight: bold; }
.offline { color: #F56C6C; font-weight: bold; }
</style>
