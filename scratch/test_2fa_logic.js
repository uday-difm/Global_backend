const speakeasy = require("speakeasy");

// 1. Generate a secret just like your POST route
const secret = speakeasy.generateSecret({ length: 20 });
console.log("--- 2FA DEBUG ---");
console.log("Secret (Base32):", secret.base32);

// 2. Generate a token for the current time
const token = speakeasy.totp({
  secret: secret.base32,
  encoding: "base32",
});
console.log("Current valid token:", token);

// 3. Verify it
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: "base32",
  token: token,
  window: 2,
});

console.log("Verification Result:", verified ? "✅ SUCCESS" : "❌ FAILED");
