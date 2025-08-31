import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, question, questionIndex } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Process audio in chunks and transcribe
    const binaryAudio = processBase64Chunks(audio);
    
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Transcription error: ${await transcriptionResponse.text()}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text;

    // Analyze the response quality
    const analysisPrompt = `You are an expert interview coach. Analyze this interview response and provide specific feedback.

Question: "${question}"
Candidate's Answer: "${transcription}"

Provide a JSON response with this exact structure:
{
  "transcription": "${transcription}",
  "clarity": 85,
  "relevance": 90,
  "completeness": 75,
  "confidence": 80,
  "feedback": "Specific feedback about the answer quality, what was good, and what could be improved",
  "suggestions": ["Specific suggestion 1", "Specific suggestion 2", "Specific suggestion 3"]
}

Scoring criteria (0-100):
- Clarity: How clear and articulate was the response?
- Relevance: How well did it address the question?
- Completeness: How thorough was the answer?
- Confidence: How confident did the candidate sound?

Be constructive and specific in your feedback.`;

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: 'Analyze this interview response.' }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    let feedback;
    
    try {
      feedback = JSON.parse(analysisData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse feedback:', analysisData.choices[0].message.content);
      // Fallback feedback
      feedback = {
        transcription,
        clarity: 75,
        relevance: 75,
        completeness: 75,
        confidence: 75,
        feedback: "Thank you for your response. Continue practicing to improve your interview skills.",
        suggestions: ["Practice speaking more clearly", "Provide more specific examples", "Structure your answers better"]
      };
    }

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-interview-audio:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});