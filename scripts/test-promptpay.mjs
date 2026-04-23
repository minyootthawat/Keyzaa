import { createRequire } from "module";
const require = createRequire(import.meta.url);
const generatePayload = require("promptpay-qr");
const QRCode = require("qrcode");

const PROMPTPAY_ID = "000000000000000";
const EMV = generatePayload(PROMPTPAY_ID, { amount: 50000 });
console.log("EMV length:", EMV.length);

// qrcode.toDataURL returns Promise<string> (base64 PNG data URL)
QRCode.toDataURL(EMV, { width: 280, margin: 2 })
  .then((dataUrl) => {
    console.log("PNG data URL type:", typeof dataUrl);
    console.log("PNG starts with:", dataUrl.slice(0, 40));
    console.log("PNG length:", dataUrl.length);
  })
  .catch(console.error);
