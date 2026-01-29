const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI 环境变量未设置');
    }

    console.log('正在连接 MongoDB Atlas...');
    console.log('数据库:', uri.substring(0, 50) + '...');
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
    console.log(`📊 数据库: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n认证失败可能原因:');
      console.error('1. 数据库用户名或密码错误');
      console.error('2. 用户权限不足');
      console.error('3. 数据库用户未创建');
      console.error('\n解决方法:');
      console.error('1. 登录 MongoDB Atlas (https://cloud.mongodb.com)');
      console.error('2. 进入 Database Access');
      console.error('3. 检查或重新创建数据库用户');
      console.error('4. 确保用户有 readWrite 权限');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n网络连接问题可能原因:');
      console.error('1. MongoDB Atlas 集群未运行');
      console.error('2. IP 白名单限制');
      console.error('3. 网络防火墙阻止');
      console.error('\n解决方法:');
      console.error('1. 登录 MongoDB Atlas');
      console.error('2. 进入 Network Access');
      console.error('3. 添加 0.0.0.0/0 (允许所有 IP)');
      console.error('4. 检查集群状态是否为 "Active"');
    }
    
    // 不退出进程，继续运行（允许试用模式）
    console.log('\n⚠️  数据库连接失败，但应用将继续运行');
    console.log('📝 试用模式仍可使用（数据保存在本地）');
    console.log('📝 登录模式需要数据库连接');
  }
};

module.exports = connectDB;
