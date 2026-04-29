import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  console.log("Booking received:", body);

  return NextResponse.json({
    message: "Stripe not configured yet",
  });
}
