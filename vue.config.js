module.exports = {
  publicPath: "/",
  outputDir: "dist",
  lintOnSave: false,
  productionSourceMap: false,
  devServer: {
    open: true,
    host: "localhost",
    port: 8099,
    https: false,
    client: {
      overlay: false, // 关闭错误遮罩层
    },
  },
};
