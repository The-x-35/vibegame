import { NextResponse } from "next/server";

const ELEVEN_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params; // currently unused; reserved for per-waifu voice selection
		const { text, voiceId, includeVisemes = true } = await req.json();
		if (!text || !voiceId) return NextResponse.json({ error: 'Missing text or voiceId' }, { status: 400 });
		const apiKey = process.env.ELEVENLABS_API_KEY;
		if (!apiKey) return NextResponse.json({ error: 'Server missing ELEVENLABS_API_KEY' }, { status: 500 });

		// Use the enhanced endpoint that includes viseme data
		const url = `${ELEVEN_BASE}/${encodeURIComponent(voiceId)}/stream`;
		const params = new URLSearchParams({
			optimize_streaming_latency: '4',
			output_format: 'pcm_22050'
		});
		
		if (includeVisemes) {
			params.append('enable_viseme_data', 'true');
		}

		const resp = await fetch(url + `?${params.toString()}`, {
			method: 'POST',
			headers: {
				'xi-api-key': apiKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				text,
				model_id: 'eleven_turbo_v2_5',
				voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }
			})
		});
		
		if (!resp.ok) {
			const t = await resp.text();
			console.error('Eleven error:', t);
			return NextResponse.json({ error: 'ElevenLabs request failed' }, { status: 500 });
		}

		// Get the audio data
		const ab = await resp.arrayBuffer();
		
		// Check if we have viseme data in the response headers
		const visemeData = resp.headers.get('x-viseme-data');
		
		if (includeVisemes && visemeData) {
			// Return both audio and viseme data
			const visemes = JSON.parse(visemeData);
			return NextResponse.json({
				audio: Array.from(new Uint8Array(ab)),
				visemes: visemes
			});
		} else {
			// Fallback to audio-only response
			return new Response(ab, {
				status: 200,
				headers: {
					'Content-Type': 'audio/pcm',
					'Cache-Control': 'no-store'
				}
			});
		}
	} catch (e) {
		console.error('[WAIFU_ELEVEN_TTS]', e);
		return NextResponse.json({ error: 'Internal error' }, { status: 500 });
	}
}
