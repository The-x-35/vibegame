# AI Character Control System

## Overview

The AI Character Control System enables AI waifus to control their 3D character models through poses, gestures, animations, and mood changes. This system is built on top of the wifegame talkinghead engine and provides comprehensive character control capabilities.

## How It Works

### 1. AI Context Enhancement
The AI (Grok) is given detailed context about available character actions through an enhanced system prompt that includes:

- **Poses**: Static body positions (straight, side, hip, turn, back, wide, oneknee, kneel, bend, sitting, dance)
- **Gestures**: Quick hand/body movements (handup, ok, index, thumbup, thumbdown, side, shrug, namaste)
- **Animations**: Continuous movements (Walking)
- **Moods**: Facial expressions and attitudes (neutral, happy, sad, excited, angry, surprised, confused, calm)

### 2. Action Parsing
The AI returns structured JSON actions alongside its text response:

```json
{
  "actions": [
    {"type": "pose", "name": "hip", "duration": 5},
    {"type": "gesture", "name": "thumbup", "duration": 3},
    {"type": "mood", "name": "happy"}
  ]
}
```

### 3. Action Execution
The frontend parses these actions and executes them on the 3D character:

- **Poses**: Uses built-in pose templates or FBX files
- **Gestures**: Triggers predefined gesture animations
- **Animations**: Plays continuous movement clips
- **Moods**: Updates character facial expression

## Available Actions

### Poses (Static Positions)
- `straight` - Stand straight and tall
- `side` - Lean to one side casually
- `hip` - Put hands on hips confidently
- `turn` - Turn your body to look around
- `back` - Look over your shoulder
- `wide` - Take a wide, confident stance
- `oneknee` - Kneel on one knee
- `kneel` - Kneel on both knees
- `bend` - Bend forward slightly
- `sitting` - Sit down
- `dance` - Strike a dance pose (FBX file)

### Gestures (Quick Movements)
- `handup` - Raise your hand
- `ok` - Make OK sign with fingers
- `index` - Point with index finger
- `thumbup` - Give thumbs up
- `thumbdown` - Give thumbs down
- `side` - Move hand to side
- `shrug` - Shrug your shoulders
- `namaste` - Put hands together in prayer/bow position

### Animations (Continuous Movements)
- `Walking` - Walk around the space (FBX file)

### Moods (Facial Expressions)
- `neutral`, `happy`, `sad`, `excited`, `angry`, `surprised`, `confused`, `calm`

## Implementation Details

### Backend (`/api/waifus/[id]/chat/grok/route.ts`)
- Enhanced system prompt with action context
- Action name mapping from natural language to wifegame names
- JSON parsing and validation
- Structured response with actions array

### Frontend (`components/waifu-chat.tsx`)
- Action execution in sequence
- Support for both built-in poses and FBX files
- Timing delays between actions for smooth transitions
- Integration with ElevenLabs TTS

### Character Engine (`components/waifu-viewer.tsx`)
- Wrapper around wifegame TalkingHead class
- Exposes action methods: `playPose`, `playGesture`, `playAnimation`, `setMood`
- Handles audio streaming and advanced lip-sync with viseme support

### Enhanced Lip-Sync System (`/api/waifus/[id]/chat/eleven/route.ts`)
- ElevenLabs integration with viseme data extraction
- Automatic fallback to word-based timing if visemes unavailable
- Support for both viseme-based and word-based lip-sync modes

## Usage Examples

### Basic Usage
```typescript
// AI will automatically include actions in responses
const response = await fetch('/api/waifus/123/chat/grok', {
  method: 'POST',
  body: JSON.stringify({ message: "Hello! Nice to meet you!" })
});

// Response includes both text and actions
const { reply, actions } = await response.json();
```

### Demo Component
Use the `WaifuDemo` component to showcase all available actions:

```tsx
<WaifuDemo 
  waifuId="123"
  voiceId="21m00Tcm4TlvDq8ikWAM"
  modelUrl="/wifegame/avatars/brunette.glb"
/>
```

## Best Practices

### For AI Responses
- Match actions to emotional context
- Use multiple actions in sequence for complex expressions
- Include appropriate durations (3-10 seconds typically)
- Be creative and expressive with movement

### For Developers
- Add new actions by updating `CHARACTER_ACTIONS` mapping
- Support both built-in templates and FBX files
- Handle action parsing gracefully with fallbacks
- Test action sequences for smooth execution

## Extending the System

### Adding New Poses
1. Add pose name to `CHARACTER_ACTIONS.poses`
2. Update system prompt with description
3. Ensure wifegame supports the pose (built-in or FBX)

### Adding New Gestures
1. Add gesture name to `CHARACTER_ACTIONS.gestures`
2. Update system prompt with description
3. Verify gesture exists in wifegame `gestureTemplates`

### Adding New Animations
1. Add animation name to `CHARACTER_ACTIONS.animations`
2. Map to FBX file path in frontend
3. Update system prompt with description

### Adding New Moods
1. Add mood name to `CHARACTER_ACTIONS.moods`
2. Update system prompt with description
3. Ensure wifegame supports the mood

## Technical Architecture

```
User Message → Grok API → Enhanced System Prompt → AI Response with Actions
     ↓
Frontend Parses Actions → Execute on WaifuViewer → 3D Character Movement
     ↓
ElevenLabs TTS → Audio + Viseme Data → Advanced Lip-sync + Actions
```

### Lip-Sync Flow
1. **ElevenLabs Request**: Text sent with `includeVisemes: true`
2. **Viseme Extraction**: Engine extracts viseme timing data from audio
3. **Fallback Handling**: If visemes unavailable, uses word-based timing
4. **Character Sync**: TalkingHead engine applies viseme morph targets for accurate lip movement

## Files Modified

- `app/api/waifus/[id]/chat/grok/route.ts` - Enhanced AI context and action parsing
- `app/api/waifus/[id]/chat/eleven/route.ts` - Enhanced ElevenLabs integration with viseme support
- `components/waifu-chat.tsx` - Action execution and advanced lip-sync integration
- `components/waifu-demo.tsx` - Demo component showcasing all features
- `AI_CHARACTER_CONTROL_DOCS.md` - This documentation

## Dependencies

- wifegame TalkingHead engine (3D character control)
- Grok API (AI responses with actions)
- ElevenLabs API (text-to-speech)
- Three.js (3D rendering)

The system provides a comprehensive foundation for AI-controlled 3D characters with natural, expressive movements that enhance the conversational experience.
