import Together from "together-ai";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Authorization header is missing API key' }, 
            { status: 401, headers: corsHeaders }
        );
    }

    const { prompt } = await req.json();

    if (!prompt) {
        return NextResponse.json(
            { error: 'No prompt provided' }, 
            { status: 400, headers: corsHeaders }
        );
    }

    const together = new Together({
      apiKey: apiKey
    });

    const response = await together.images.create({
        prompt: prompt,
        model: "black-forest-labs/FLUX.1-schnell",
        width: 1024,
        height: 768,
        // steps: 3,
        response_format: "base64",
    });

    const b64_json: string = response.data[0].b64_json as string;
    const blob = new Blob([b64_json], { type: 'image/png' });
    const url = URL.createObjectURL(blob);

    return NextResponse.json({ image: url }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error generating image:', error);

    return NextResponse.json(
        { error: 'Image generation failed' }, 
        { status: 500, headers: corsHeaders }
    );
  }
}