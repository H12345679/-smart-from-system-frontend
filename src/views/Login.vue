<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">智慧养殖管理系统</h2>
      <p class="subtitle">RAS 工厂化循环水养殖综合管理平台</p>
      <el-form :model="form" :rules="rules" ref="loginForm" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" prefix-icon="el-icon-user" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" prefix-icon="el-icon-lock" placeholder="密码" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width:100%" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <p class="demo-hint">演示账号: admin / admin123</p>
    </div>
  </div>
</template>

<script>
import { login } from "../api/modules/auth";
import { setStore } from "../libs/storage";

export default {
  name: "Login",
  data() {
    return {
      form: { username: "", password: "" },
      rules: {
        username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }],
      },
      loading: false,
    };
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await login(this.form);
          setStore("token", res.data.token);
          setStore("userInfo", JSON.stringify(res.data));
          setStore("role", res.data.role);
          this.$message.success("登录成功");
          this.$router.push("/dashboard");
        } catch (e) {
          this.$message.error(e.message || "登录失败");
        } finally {
          this.loading = false;
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.title {
  text-align: center;
  color: #1a3a5c;
  margin-bottom: 8px;
}
.subtitle {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-bottom: 30px;
}
.demo-hint {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  margin-top: 12px;
}
</style>
