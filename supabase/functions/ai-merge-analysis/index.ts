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
    const { tracks, mergeStyle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing ${tracks.length} tracks for ${mergeStyle} merge`);

    const trackInfo = tracks.map((t: any, i: number) => 
      `Track ${i + 1}: "${t.name}" - ${t.bpm} BPM, ${t.duration.toFixed(1)}s, Key: ${t.key || 'Unknown'}`
    ).join('\n');

    const prompt = `You are an expert DJ and music producer. Analyze these tracks and provide intelligent merge recommendations:

${trackInfo}

Merge Style: ${mergeStyle}

Provide a JSON response with:
1. "beatAlignment": Array of objects with trackIndex and recommended startOffset (in seconds) to align downbeats
2. "tempoRecommendation": The target BPM all tracks should match to (pick the most suitable)
3. "keyCompatibility": Analysis of key compatibility and any pitch adjustments needed
4. "stemPriority": For each track, which stems (vocals, drums, bass, melody) should be emphasized or reduced
5. "transitionPoints": Recommended timestamps for transitions between tracks
6. "mixingTips": Array of 3-5 professional mixing tips for this specific combination
7. "energyFlow": Description of how energy should flow through the merged track

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert music producer and DJ. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received:", content.substring(0, 200));

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return fallback analysis
      analysis = {
        beatAlignment: tracks.map((_: any, i: number) => ({ trackIndex: i, startOffset: 0 })),
        tempoRecommendation: tracks[0]?.bpm || 120,
        keyCompatibility: "Analysis unavailable",
        stemPriority: tracks.map((_: any, i: number) => ({
          trackIndex: i,
          vocals: 0.8,
          drums: 1.0,
          bass: 0.9,
          melody: 0.7
        })),
        transitionPoints: [],
        mixingTips: ["Use crossfades for smooth transitions", "Match BPMs before merging", "Balance volumes carefully"],
        energyFlow: "Build energy gradually through the merged track"
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-merge-analysis:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      analysis: null
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
