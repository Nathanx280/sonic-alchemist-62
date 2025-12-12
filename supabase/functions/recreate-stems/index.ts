import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StemRecreationRequest {
  trackName: string;
  stemType: 'vocals' | 'drums' | 'bass' | 'melody';
  style: string;
  intensity: number;
  originalBpm?: number;
  originalKey?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackName, stemType, style, intensity, originalBpm, originalKey } = await req.json() as StemRecreationRequest;
    
    console.log(`Recreating ${stemType} stem for "${trackName}" with style: ${style}, intensity: ${intensity}`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const stemDescriptions: Record<string, string> = {
      vocals: "vocal melodies, harmonies, lead lines, and backing vocals",
      drums: "drum patterns, percussion, hi-hats, kicks, snares, and rhythmic elements",
      bass: "basslines, sub-bass, and low-frequency rhythmic patterns",
      melody: "melodic hooks, synth leads, piano riffs, and harmonic progressions"
    };

    const styleModifiers: Record<string, string> = {
      'electronic': 'with synthesized, electronic textures and digital effects',
      'acoustic': 'with organic, acoustic instruments and natural tones',
      'hip-hop': 'with urban, hip-hop influenced rhythms and swagger',
      'rock': 'with energetic, guitar-driven rock elements',
      'jazz': 'with jazzy, improvised feel and complex harmonies',
      'classical': 'with orchestral, classical music arrangements',
      'lo-fi': 'with warm, lo-fi textures and vinyl crackle aesthetics',
      'future-bass': 'with wobbly, future bass synths and emotional drops',
      'trap': 'with hard-hitting 808s and trap-style hi-hat rolls',
      'ambient': 'with atmospheric, ambient textures and ethereal pads'
    };

    const systemPrompt = `You are an expert music producer and sound designer AI. Your task is to describe how to recreate and reimagine audio stems for music remixing. 

When given a stem type, style, and intensity, provide:
1. A detailed musical description of the new stem variation
2. Specific production techniques to apply
3. Suggested effects and processing
4. How it should interact with other stems
5. A creative name for this variation

Always be musically accurate and provide actionable creative direction.`;

    const userPrompt = `Recreate the ${stemType.toUpperCase()} stem for a track called "${trackName}".

Original track info:
- BPM: ${originalBpm || 'Unknown'}
- Key: ${originalKey || 'Unknown'}

Requested style: ${style} ${styleModifiers[style] || ''}
Intensity level: ${intensity}/100 (higher = more dramatic transformation)

The ${stemType} stem contains: ${stemDescriptions[stemType]}

Provide a creative reimagining of this stem that:
1. Maintains musicality with the original track
2. Transforms according to the ${style} style at ${intensity}% intensity
3. Can blend seamlessly with other stems

Format your response as JSON with these fields:
- variationName: string (creative name for this stem variation)
- description: string (2-3 sentences describing the new sound)
- techniques: string[] (3-5 production techniques)
- effects: string[] (3-5 suggested effects)
- interactionNotes: string (how it should blend with other stems)
- energyLevel: number (1-10 scale)
- complexity: number (1-10 scale)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON response
    let recreation;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      recreation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Provide a fallback structure
      recreation = {
        variationName: `${style.charAt(0).toUpperCase() + style.slice(1)} ${stemType}`,
        description: content.slice(0, 200),
        techniques: ["EQ sculpting", "Compression", "Saturation"],
        effects: ["Reverb", "Delay", "Chorus"],
        interactionNotes: "Blend carefully with other stems",
        energyLevel: Math.round(intensity / 10),
        complexity: 5
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      recreation,
      stemType,
      style,
      trackName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recreate-stems function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
