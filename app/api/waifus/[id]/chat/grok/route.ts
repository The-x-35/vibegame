import { NextResponse } from "next/server";
import { query } from '@/lib/db';

// Use OpenRouter proxy for xAI models
const GROK_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";

// Available character actions and their mappings
const CHARACTER_ACTIONS = {
	// Built-in poses (from wifegame poseTemplates) and external FBX poses
	poses: {
		'straight': 'straight',
		'side': 'side', 
		'hip': 'hip',
		'turn': 'turn',
		'back': 'back',
		'wide': 'wide',
		'oneknee': 'oneknee',
		'kneel': 'kneel',
		'bend': 'bend',
		'sitting': 'sitting',
		'stand': 'straight',
		'stand straight': 'straight',
		'lean': 'side',
		'lean to side': 'side',
		'hands on hips': 'hip',
		'turn around': 'turn',
		'look back': 'back',
		'wide stance': 'wide',
		'on one knee': 'oneknee',
		'kneeling': 'kneel',
		'bend over': 'bend',
		'sit down': 'sitting',
		'dance': '/wifegame/poses/dance.fbx',
		'dancing': '/wifegame/poses/dance.fbx',
		'dance pose': '/wifegame/poses/dance.fbx'
	},
	
	// Gestures (from wifegame gestureTemplates)
	gestures: {
		'handup': 'handup',
		'raise hand': 'handup',
		'hand up': 'handup',
		'ok': 'ok',
		'okay': 'ok',
		'index': 'index',
		'point': 'index',
		'point finger': 'index',
		'thumbup': 'thumbup',
		'thumbs up': 'thumbup',
		'good': 'thumbup',
		'thumbdown': 'thumbdown',
		'thumbs down': 'thumbdown',
		'bad': 'thumbdown',
		'side': 'side',
		'hand to side': 'side',
		'shrug': 'shrug',
		'namaste': 'namaste',
		'pray': 'namaste',
		'bow': 'namaste'
	},
	
	// Animations (from wifegame animations)
	animations: {
		'walk': 'Walking',
		'walking': 'Walking',
		'walk around': 'Walking',
		'move': 'Walking'
	},
	
	// Moods
	moods: {
		'neutral': 'neutral',
		'happy': 'happy',
		'sad': 'sad',
		'excited': 'excited',
		'angry': 'angry',
		'surprised': 'surprised',
		'confused': 'confused',
		'calm': 'calm'
	}
};

function createSystemPrompt(basePrompt: string): string {
	return `${basePrompt}

You are a 3D character with full control over your body movements, poses, gestures, and animations. You can perform the following actions:

POSES (hold a static position):
- straight: Stand straight and tall
- side: Lean to one side casually  
- hip: Put hands on hips confidently
- turn: Turn your body to look around
- back: Look over your shoulder
- wide: Take a wide, confident stance
- oneknee: Kneel on one knee
- kneel: Kneel on both knees
- bend: Bend forward slightly
- sitting: Sit down
- dance: Strike a dance pose

GESTURES (quick hand/body movements):
- handup: Raise your hand
- ok: Make OK sign with fingers
- index: Point with index finger
- thumbup: Give thumbs up
- thumbdown: Give thumbs down  
- side: Move hand to side
- shrug: Shrug your shoulders
- namaste: Put hands together in prayer/bow position

ANIMATIONS (continuous movements):
- Walking: Walk around the space

MOODS (facial expression/attitude):
- neutral, happy, sad, excited, angry, surprised, confused, calm

When responding, you can include actions by adding them in this JSON format at the end of your response:

{"actions": [
  {"type": "pose", "name": "pose_name", "duration": 5},
  {"type": "gesture", "name": "gesture_name", "duration": 3}, 
  {"type": "animation", "name": "animation_name", "duration": 10},
  {"type": "mood", "name": "mood_name"}
]}

You can perform multiple actions in sequence. Be expressive and use your full range of movement to enhance your responses!

Examples of good usage:
- When greeting someone: Use a friendly gesture like "thumbup" or "ok" 
- When thinking: Use "shrug" or "side" pose
- When excited: Use "handup" gesture and "happy" mood
- When dancing: Use "dance" pose or "Walking" animation
- When being dramatic: Use multiple poses in sequence like "turn" then "back"
- When being confident: Use "hip" pose (hands on hips)

Always match your actions to your emotional state and what you're saying. Be creative and expressive!`;
}

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const { message } = await req.json();
		if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

        const result = await query(
            "SELECT system_prompt FROM projects WHERE id = $1 AND type = 'waifu'",
            [id]
        );
		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Waifu not found' }, { status: 404 });
		}
		const basePrompt = result.rows[0].system_prompt || 'You are a helpful AI waifu.';
		const systemPrompt = createSystemPrompt(basePrompt);

		const apiKey = process.env.GROK_API_KEY;
		if (!apiKey) {
			return NextResponse.json({ error: 'Server missing GROK_API_KEY' }, { status: 500 });
		}

        const resp = await fetch(GROK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                // Optional but recommended by OpenRouter for attribution/rate limits
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'VibeGame'
			},
			body: JSON.stringify({
                model: 'x-ai/grok-code-fast-1',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: message }
				],
				temperature: 0.8
			})
		});

		if (!resp.ok) {
			const t = await resp.text();
			console.error('Grok error:', t);
			return NextResponse.json({ error: 'Grok request failed' }, { status: 500 });
		}
		const data = await resp.json();
		const fullResponse = data?.choices?.[0]?.message?.content || '';
		
		// Parse actions from response
		let reply = fullResponse;
		let actions: Array<{
			type: 'pose' | 'gesture' | 'animation' | 'mood';
			name: string;
			duration?: number;
		}> = [];
		
		try {
			// Look for JSON actions at the end of the response
			const jsonMatch = fullResponse.match(/\{[\s\S]*"actions"[\s\S]*\}/);
			if (jsonMatch) {
				const actionsData = JSON.parse(jsonMatch[0]);
				if (actionsData.actions && Array.isArray(actionsData.actions)) {
					actions = actionsData.actions;
					// Remove the JSON from the reply
					reply = fullResponse.replace(jsonMatch[0], '').trim();
				}
			}
		} catch (e) {
			// If JSON parsing fails, just use the full response as reply
			console.log('Could not parse actions JSON:', e);
		}
		
		return NextResponse.json({ 
			reply, 
			actions: actions.map(action => {
				// Map action names to actual wifegame names
				const mappedAction = { ...action };
				
				if (action.type === 'pose' && action.name in CHARACTER_ACTIONS.poses) {
					mappedAction.name = CHARACTER_ACTIONS.poses[action.name as keyof typeof CHARACTER_ACTIONS.poses];
				} else if (action.type === 'gesture' && action.name in CHARACTER_ACTIONS.gestures) {
					mappedAction.name = CHARACTER_ACTIONS.gestures[action.name as keyof typeof CHARACTER_ACTIONS.gestures];
				} else if (action.type === 'animation' && action.name in CHARACTER_ACTIONS.animations) {
					mappedAction.name = CHARACTER_ACTIONS.animations[action.name as keyof typeof CHARACTER_ACTIONS.animations];
				} else if (action.type === 'mood' && action.name in CHARACTER_ACTIONS.moods) {
					mappedAction.name = CHARACTER_ACTIONS.moods[action.name as keyof typeof CHARACTER_ACTIONS.moods];
				}
				
				return mappedAction;
			})
		});
	} catch (error) {
		console.error('[WAIFU_CHAT_GROK]', error);
		return NextResponse.json({ error: 'Internal error' }, { status: 500 });
	}
}
