import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/reviews";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function GET() {
    try {
        await dbConnect();
        const reviews = await Review.find({});
        return NextResponse.json(reviews, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        await dbConnect();
        const body = await req.json();
        const reviewdata = { ...body, userId: session.user.id };
        const newReview = await Review.create(reviewdata);
        return NextResponse.json(newReview, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
