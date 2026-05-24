<template>
  <div class="device-page">
    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="设备类型">
          <el-select v-model="filter.deviceType" placeholder="全部" clearable>
            <el-option label="传感器" value="SENSOR" />
            <el-option label="执行器" value="ACTUATOR" />
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态">
          <el-select v-model="filter.onlineStatus" placeholder="全部" clearable>
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="fetchDevices">搜索</el-button>
          <el-button type="success" icon="el-icon-plus" @click="registerVisible = true">注册设备</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top:16px" v-loading="loading">
      <el-table :data="deviceList" stripe>
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="macAddress" label="MAC地址" width="160" />
        <el-table-column prop="deviceType" label="类型" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.deviceType === 'SENSOR' ? 'info' : 'warning'" size="small">
              {{ row.deviceType === 'SENSOR' ? '传感器' : '执行器' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parameterType" label="监测参数" width="120" />
        <el-table-column prop="tankId" label="水池ID" width="80" />
        <el-table-column label="状态" width="80">
          <template slot-scope="{ row }">
            <span :class="row.onlineStatus ? 'online' : 'offline'">{{ row.onlineStatus ? '在线' : '离线' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template slot-scope="{ row }">
            <el-button size="mini" type="primary" v-if="row.deviceType === 'ACTUATOR'" @click="controlDevice(row)" :loading="row._loading">
              控制
            </el-button>
            <el-button size="mini" type="danger" @click="removeDevice(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:16px;text-align:right" :current-page="page" :page-size="size" :total="total" @current-change="handlePageChange" layout="total, prev, pager, next" />
    </el-card>

    <!-- 注册弹窗 -->
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
        <el-form-item label="绑定水池ID"><el-input-number v-model="registerForm.tankId" :min="1" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRegister" :loading="submitLoading">确认注册</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listDevices, registerDevice, sendCommand, removeDevice as apiRemoveDevice } from "../api/modules/device";

export default {
  name: "Device",
  data() {
    return {
      loading: false, submitLoading: false, registerVisible: false,
      filter: { deviceType: "", onlineStatus: "" },
      page: 1, size: 10, total: 0,
      deviceList: [],
      registerForm: { deviceName: "", macAddress: "", deviceType: "SENSOR", parameterType: "DO", tankId: 1 },
    };
  },
  created() { this.fetchDevices(); },
  methods: {
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
      } catch (e) {
        this.$message.error("获取设备列表失败");
      } finally { this.loading = false; }
    },
    handlePageChange(p) { this.page = p; this.fetchDevices(); },
    async submitRegister() {
      this.submitLoading = true;
      try {
        await registerDevice(this.registerForm);
        this.$message.success("设备注册成功");
        this.registerVisible = false;
        this.fetchDevices();
      } catch (e) {
        this.$message.error(e.message || "注册失败");
      } finally { this.submitLoading = false; }
    },
    async controlDevice(row) {
      row._loading = true;
      try {
        await sendCommand({ deviceId: row.id, action: "ON" });
        this.$message.success("指令已下发");
      } catch (e) {
        this.$message.error("指令下发失败");
      } finally { row._loading = false; }
    },
    removeDevice(row) {
      this.$confirm(`确认删除 "${row.deviceName}"?`, "警告", { type: "warning" }).then(async () => {
        try {
          await apiRemoveDevice(row.id);
          this.$message.success("删除成功");
          this.fetchDevices();
        } catch (e) { this.$message.error("删除失败"); }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.filter-card { border-radius: 8px; }
.online { color: #67C23A; font-weight: bold; }
.offline { color: #F56C6C; font-weight: bold; }
</style>
