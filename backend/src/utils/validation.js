// 输入验证工具函数

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateImageBase64 = (base64) => {
  if (!base64) return false;
  return base64.startsWith('data:image/');
};

module.exports = {
  validateEmail,
  validatePassword,
  validateImageBase64
};
