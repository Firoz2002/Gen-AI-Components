import { NextRequest, NextResponse } from 'next/server';
import Groq from "groq-sdk";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

async function callGroq(apiKey: string, prompt: string) {
    const groq = new Groq({ apiKey });
    return await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: `You are a helpful assistant that answers questions about the world. ${prompt}`,
            },
        ],
        model: "llama-3.3-70b-versatile",
    });
}

async function callTogetherAI(apiKey: string, prompt: string) {
    const model = new TogetherAI({
        apiKey,
        model: "togethercomputer/llama-2-70b-chat",
    });
    
    const messages = [
        new SystemMessage("You are a helpful assistant that answers questions about the world."),
        new HumanMessage(prompt),
    ];
    
    return await model.invoke(messages);
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

        const body = await req.json();
        const { prompt } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'No valid prompt provided' }, 
                { status: 400, headers: corsHeaders }
            );
        }

        let content: string;

        try {
            const groqResponse = await callGroq(apiKey, prompt);
            if (!groqResponse?.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from Groq API');
            }
            content = groqResponse.choices[0].message.content;
        } catch (groqError) {
            console.warn("Groq API failed, falling back to Together AI:", groqError);

            try {
                content = await callTogetherAI(apiKey, prompt);
            } catch (togetherAIError) {
                console.error("Both Groq and Together AI failed:", togetherAIError);
                throw new Error('All AI service providers failed');
            }
        }

        return NextResponse.json(
            { content },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("Error generating response:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Content generation failed' }, 
            { status: 500, headers: corsHeaders }
        );
    }
}