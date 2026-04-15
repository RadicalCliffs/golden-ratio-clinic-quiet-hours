import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      preferredDate,
      preferredTime,
      contactMethod,
      message,
      consent,
    } = body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !preferredDate ||
      !preferredTime ||
      !consent
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { error } = await getSupabase().from("bookings").insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      contact_method: contactMethod,
      message: message || null,
      consent_given: consent,
      status: "pending",
    });

    if (error) {
      console.error("Supabase booking error:", error);
      return NextResponse.json(
        { error: "We couldn't process your booking right now. Please try again or call us directly." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
