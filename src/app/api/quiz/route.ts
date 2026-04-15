import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { answers, totalScore, result } = body;

    const { error } = await getSupabase().from("quiz_submissions").insert({
      answers,
      total_score: totalScore,
      result_category: result,
    });

    if (error) {
      console.error("Supabase quiz error:", error);
      return NextResponse.json(
        { error: "Could not save quiz results." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
