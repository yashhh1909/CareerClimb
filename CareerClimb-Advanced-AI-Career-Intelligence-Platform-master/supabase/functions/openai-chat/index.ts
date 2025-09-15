
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to clean and parse AI response
function parseAIResponse(responseText: string) {
  // Remove markdown code blocks if present
  let cleanText = responseText.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  return cleanText.trim();
}

// Function to call Gemini API
async function callGemini(systemPrompt: string, userPrompt: string, maxTokens: number) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const requestBody = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\nUser Request: ${userPrompt}`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: maxTokens,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  const responseText = data.candidates[0].content.parts[0].text;
  return parseAIResponse(responseText);
}

// Function to call OpenAI API as fallback
async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens: number) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices[0].message.content;
  return parseAIResponse(responseText);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type } = await req.json()
    
    console.log('Request type:', type)
    console.log('Prompt:', prompt.substring(0, 200) + '...')

    let systemPrompt = ''
    let maxTokens = 1000

    switch (type) {
      case 'resume_analysis':
        systemPrompt = `You are an expert Applicant Tracking System (ATS) for Data Science and Software Engineering roles. Analyze the resume against the job description and provide:
        1. A numerical score out of 100
        2. Detailed feedback on keyword matching, technical skills alignment, and areas for improvement
        3. If score is below 85, identify 3-5 specific weak lines from the resume and suggest stronger alternatives
        
        Format your response EXACTLY as:
        Score: [NUMBER]/100
        Feedback: [YOUR DETAILED FEEDBACK]
        
        If score < 85, also include:
        Weak Lines:
        1. Original: "[EXACT LINE FROM RESUME]" 
           Issue: [WHY IT'S WEAK]
           Suggestion: "[IMPROVED VERSION]"
        2. Original: "[EXACT LINE FROM RESUME]"
           Issue: [WHY IT'S WEAK] 
           Suggestion: "[IMPROVED VERSION]"
        [Continue for 3-5 weak lines]`
        maxTokens = 2000
        break
        
      case 'email_generation':
        systemPrompt = `You are a professional email assistant. Generate a clear, professional email reply based on the context provided. 

        IMPORTANT: Do NOT make assumptions about job roles, positions, or employment status unless they are explicitly mentioned in the email context. Focus on being helpful and professional while staying true to what is actually provided in the context.

        If the context is brief or unclear, create an appropriate response based on what is actually stated without adding assumptions about software development, job searching, or specific roles.`
        maxTokens = 800
        break
        
      case 'interview_questions':
        systemPrompt = `You are an expert interviewer. Generate 5-7 distinct interview questions that are relevant and professional. Focus on assessing problem-solving skills and experience.`
        maxTokens = 1200
        break
        
      case 'cover_letter_generation':
        systemPrompt = `You are a professional cover letter writer. Generate a compelling, personalized cover letter that:
        1. Addresses the specific company and role mentioned
        2. Highlights relevant skills and experience for the position
        3. Matches the company culture and values described
        4. Uses the specified tone throughout
        5. Includes a strong opening and compelling closing
        6. Is approximately 3-4 paragraphs in length
        7. Shows genuine interest and enthusiasm for the opportunity
        
        Make the cover letter professional, engaging, and tailored specifically to this opportunity.`
        maxTokens = 1500
        break
        
      default:
        throw new Error('Invalid request type')
    }

    let result;
    let usedProvider = 'Gemini';

    try {
      console.log('Attempting to use Gemini API...');
      result = await callGemini(systemPrompt, prompt, maxTokens);
      console.log('Gemini API successful');
    } catch (geminiError) {
      console.log('Gemini API failed, switching to OpenAI...', geminiError.message);
      usedProvider = 'OpenAI';
      
      try {
        result = await callOpenAI(systemPrompt, prompt, maxTokens);
        console.log('OpenAI API successful');
      } catch (openaiError) {
        console.error('Both APIs failed:', { gemini: geminiError.message, openai: openaiError.message });
        throw new Error('Both Gemini and OpenAI APIs failed. Please check your API keys.');
      }
    }

    return new Response(
      JSON.stringify({ 
        response: result,
        provider: usedProvider 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in openai-chat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Please check if your API keys are valid and have proper permissions'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
