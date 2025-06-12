import { NextRequest, NextResponse } from 'next/server';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai';

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

        const model = new ChatTogetherAI({
            apiKey: apiKey,
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            temperature: 0.8,
            maxTokens: 1000,
        });

        const response = await model.invoke([
            new SystemMessage("You are a helpful assistant who writes engaging, SEO-friendly blog posts with structure and clarity. The content should be in html format"),
            new HumanMessage(prompt),
        ]);

        const content = response.text.trim();

        return NextResponse.json({ content }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error("Error generating response:", error);
        return NextResponse.json(
            { error: 'Content generation failed' }, 
            { status: 500, headers: corsHeaders }
        );
    }
}