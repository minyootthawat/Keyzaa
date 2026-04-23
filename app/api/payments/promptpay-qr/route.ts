/**
 * GET /api/payments/promptpay-qr?amount=50000&orderId=ord_123
 *
 * Generates a real PromptPay QR code:
 * 1. promptpay-qr generates the EMV payload string
 * 2. qrcode converts the EMV string to a base64 PNG data URL
 *
 * Query params:
 *   amount  — satang (1 Baht = 100 satang), e.g. 50000 = ฿500.00
 *   orderId — optional order reference for the QR payload
 *
 * Response:
 *   { qrData: string,    base64 PNG data URL
 *     expiresAt: string, ISO timestamp (3 min from now)
 *     amount: number,    satang amount
 *     merchantName: "Keyzaa"
 *   }
 */

import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const generatePromptPayPayload = require("promptpay-qr") as (
  target: string,
  opts: { amount?: number; ref?: string }
) => string;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require("qrcode") as {
  toDataURL: (text: string, opts?: { width?: number; margin?: number }) => Promise<string>;
};

const QR_EXPIRY_SECONDS = 180;
// Test PromptPay ID — replace with a real merchant ID for production
const PROMPTPAY_ID = "000000000000000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amountStr = searchParams.get("amount");
    const orderId = searchParams.get("orderId");

    const amount = parseInt(amountStr ?? "", 10);
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Invalid or missing amount parameter (satang, min 1)" },
        { status: 400 }
      );
    }

    // Step 1: Build EMV QR payload
    const emvPayload = generatePromptPayPayload(PROMPTPAY_ID, {
      amount,
      ref: orderId ? String(orderId).slice(0, 20) : undefined,
    });

    // Step 2: Convert EMV string to base64 PNG
    const qrData = await QRCode.toDataURL(emvPayload, { width: 280, margin: 2 });

    const expiresAt = new Date(
      Date.now() + QR_EXPIRY_SECONDS * 1000
    ).toISOString();

    return NextResponse.json({ qrData, expiresAt, amount, merchantName: "Keyzaa" });
  } catch (error) {
    console.error("PromptPay QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
