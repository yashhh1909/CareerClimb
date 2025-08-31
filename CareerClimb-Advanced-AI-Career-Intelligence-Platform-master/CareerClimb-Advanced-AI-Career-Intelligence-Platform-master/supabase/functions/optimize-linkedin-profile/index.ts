
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean and parse AI response
function parseAIResponse(responseText: string) {
  // Remove markdown code blocks if present
  let cleanText = responseText.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  return JSON.parse(cleanText.trim());
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
        text: `${systemPrompt}\n\nUser: ${userPrompt}`
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
async function callOpenAI(systemPrompt: string, userPrompt: string) {
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
      max_tokens: 1500,
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, currentRole, industry, targetRole, experience, skills, currentProfile } = await req.json();

    console.log('LinkedIn optimization request:', { type, currentRole, industry });

    let systemPrompt = '';
    let userPrompt = '';
    let responseKey = '';

    switch (type) {
      case 'headline':
        systemPrompt = `You are a LinkedIn optimization expert specializing in creating compelling professional headlines. Your headlines should be:
        - Attention-grabbing and professional
        - Include relevant keywords for ${industry}
        - Show value proposition clearly
        - Be under 220 characters
        - Stand out from generic headlines
        
        Create 5 unique, powerful headline variations that showcase expertise and attract the right opportunities.
        
        Return ONLY a JSON array of headline strings:
        ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"]`;
        
        userPrompt = `Current Role: ${currentRole}
        Industry: ${industry}
        Years of Experience: ${experience}
        Key Skills: ${skills?.join(', ') || 'Not specified'}
        Current Headline: ${currentProfile || 'None'}
        
        Generate 5 compelling LinkedIn headlines that will attract recruiters and industry professionals.`;
        responseKey = 'suggestions';
        break;

      case 'connection_strategy':
        systemPrompt = `You are a LinkedIn networking strategist. Create a comprehensive connection strategy that includes:
        1. Daily connection targets (realistic numbers)
        2. Specific target profiles to connect with
        3. Personalized message templates
        4. Best practices for engagement
        
        Focus on quality over quantity and provide actionable, specific guidance.
        
        Return ONLY a JSON object with this structure:
        {
          "dailyConnections": number,
          "targetProfiles": ["profile type 1", "profile type 2", "profile type 3"],
          "messageTemplates": ["template 1", "template 2", "template 3"],
          "engagementTips": ["tip 1", "tip 2", "tip 3"],
          "industrySpecificAdvice": ["advice 1", "advice 2", "advice 3"]
        }`;
        
        userPrompt = `Current Role: ${currentRole}
        Target Role: ${targetRole}
        Industry: ${industry}
        Years of Experience: ${experience}
        Key Skills: ${skills?.join(', ') || 'Not specified'}
        
        Create a personalized LinkedIn connection strategy to help achieve career goals.`;
        responseKey = 'strategy';
        break;

      case 'content_ideas':
        systemPrompt = `You are a LinkedIn content strategist. Generate engaging, professional content ideas that will:
        - Showcase expertise in ${industry}
        - Build thought leadership
        - Engage the professional community
        - Drive meaningful conversations
        
        Each idea should include a compelling title and detailed content guidance.
        
        Return ONLY a JSON array with this structure:
        [
          {
            "type": "content category",
            "title": "compelling title",
            "content": "detailed content guidance and key points to cover",
            "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
            "engagementHook": "question or call-to-action to drive engagement"
          }
        ]`;
        
        userPrompt = `Current Role: ${currentRole}
        Target Role: ${targetRole}
        Industry: ${industry}
        Years of Experience: ${experience}
        Key Skills: ${skills?.join(', ') || 'Not specified'}
        
        Generate 5 content ideas for LinkedIn posts that will establish thought leadership and engage my professional network.`;
        responseKey = 'ideas';
        break;

      default:
        throw new Error('Invalid optimization type');
    }

    let result;
    let usedProvider = 'Gemini';

    try {
      console.log('Attempting to use Gemini API...');
      result = await callGemini(systemPrompt, userPrompt, 1500);
      console.log('Gemini API successful');
    } catch (geminiError) {
      console.log('Gemini API failed, switching to OpenAI...', geminiError.message);
      usedProvider = 'OpenAI';
      
      try {
        result = await callOpenAI(systemPrompt, userPrompt);
        console.log('OpenAI API successful');
      } catch (openaiError) {
        console.error('Both APIs failed:', { gemini: geminiError.message, openai: openaiError.message });
        throw new Error('Both Gemini and OpenAI APIs failed. Please check your API keys.');
      }
    }

    return new Response(JSON.stringify({ 
      [responseKey]: result,
      provider: usedProvider 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-linkedin-profile:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Please check if your API keys are valid and try again'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
