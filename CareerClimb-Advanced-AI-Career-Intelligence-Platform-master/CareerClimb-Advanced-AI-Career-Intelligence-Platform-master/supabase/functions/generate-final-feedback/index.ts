import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, responses, industry, difficulty } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Calculate average scores
    const avgClarity = responses.reduce((sum: number, r: any) => sum + r.clarity, 0) / responses.length;
    const avgRelevance = responses.reduce((sum: number, r: any) => sum + r.relevance, 0) / responses.length;
    const avgCompleteness = responses.reduce((sum: number, r: any) => sum + r.completeness, 0) / responses.length;
    const avgConfidence = responses.reduce((sum: number, r: any) => sum + r.confidence, 0) / responses.length;

    const systemPrompt = `You are an expert interview coach providing comprehensive feedback for a ${industry} interview at ${difficulty} level.

Performance Summary:
- Average Clarity: ${avgClarity.toFixed(1)}/100
- Average Relevance: ${avgRelevance.toFixed(1)}/100  
- Average Completeness: ${avgCompleteness.toFixed(1)}/100
- Average Confidence: ${avgConfidence.toFixed(1)}/100

Interview Questions and Responses:
${questions.map((q: any, i: number) => `
Question ${i + 1}: ${q.question}
Response: ${responses[i].transcription}
Scores: Clarity(${responses[i].clarity}) Relevance(${responses[i].relevance}) Completeness(${responses[i].completeness}) Confidence(${responses[i].confidence})
`).join('\n')}

Provide a comprehensive final assessment in this exact JSON format:
{
  "overallScore": 85,
  "communicationScore": 88,
  "confidenceScore": 82,
  "technicalScore": 90,
  "overallFeedback": "Comprehensive summary of performance",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2", "Area 3"],
  "nextSteps": ["Action 1", "Action 2", "Action 3"],
  "industrySpecificTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Be specific, actionable, and encouraging while maintaining honesty about areas for improvement.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the final comprehensive interview feedback.' }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let finalFeedback;
    
    try {
      finalFeedback = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse final feedback:', data.choices[0].message.content);
      // Fallback feedback
      finalFeedback = {
        overallScore: Math.round((avgClarity + avgRelevance + avgCompleteness + avgConfidence) / 4),
        communicationScore: Math.round((avgClarity + avgConfidence) / 2),
        confidenceScore: Math.round(avgConfidence),
        technicalScore: Math.round((avgRelevance + avgCompleteness) / 2),
        overallFeedback: "Good interview performance with room for improvement in specific areas.",
        strengths: ["Clear communication", "Good technical knowledge", "Professional demeanor"],
        improvements: ["Provide more specific examples", "Structure answers better", "Show more confidence"],
        nextSteps: ["Practice common interview questions", "Prepare STAR method examples", "Work on presentation skills"],
        industrySpecificTips: ["Stay updated with industry trends", "Practice technical scenarios", "Build portfolio projects"]
      };
    }

    // Try to save to database (optional - won't fail if no auth)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        await supabase.from('interview_sessions').insert({
          industry,
          difficulty,
          questions,
          responses,
          final_feedback: finalFeedback,
          overall_score: finalFeedback.overallScore,
          communication_score: finalFeedback.communicationScore,
          confidence_score: finalFeedback.confidenceScore,
          technical_score: finalFeedback.technicalScore
        });
      }
    } catch (dbError) {
      console.log('Database save failed (optional):', dbError);
      // Continue without failing - database save is optional
    }

    return new Response(JSON.stringify({ finalFeedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-final-feedback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});