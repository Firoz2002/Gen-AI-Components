import Together from "together-ai";
import { NextRequest } from "next/server";

const together = new Together({
    apiKey: process.env.TOGETHER_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const response = await together.images.create({
        prompt: prompt,
        model: "black-forest-labs/FLUX.1-schnell",
        width: 1024,
        height: 768,
        // steps: 3,
        response_format: "base64",
    });

    return Response.json(response.data[0]);
  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json(error, { status: 500 });
  }
}