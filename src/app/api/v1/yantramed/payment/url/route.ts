import { NextRequest } from "next/server";
import { handlePaymentUrlGet } from "../handlePaymentUrl";

export async function GET(request: NextRequest) {
  return handlePaymentUrlGet(request, "/api/v1/yantramed/payment/url");
}
