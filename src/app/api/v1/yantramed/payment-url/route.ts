import { NextRequest } from "next/server";
import { handlePaymentUrlGet } from "../payment/handlePaymentUrl";

/** Flatter alias — preferred for mobile: /api/v1/yantramed/payment-url */
export async function GET(request: NextRequest) {
  return handlePaymentUrlGet(request, "/api/v1/yantramed/payment-url");
}
