import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, difficulty } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert technical interviewer for ${industry} roles. Generate exactly 5 high-quality interview questions based on the ${difficulty} difficulty level. 

For each question, provide:
1. A realistic, industry-specific question
2. Key points the answer should cover
3. Follow-up questions to dive deeper

Difficulty levels:
- Junior: Basic concepts, fundamental knowledge
- Mid-level: Problem-solving, experience-based scenarios
- Senior: Architecture, leadership, complex technical decisions

Return ONLY a JSON array of questions in this exact format:
[
  {
    "question": "Main interview question here",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "followUp": "Follow-up question to ask based on their answer"
  }
]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate interview questions for ${industry} at ${difficulty} level.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let questions;
    
    try {
      questions = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse questions:', data.choices[0].message.content);
      throw new Error('Failed to generate valid questions');
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-interview-questions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});