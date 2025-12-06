# Guide de Migration : expo-av → expo-audio

## ⚠️ Important
`expo-av` est déprécié et sera supprimé dans SDK 54. Il faut migrer vers `expo-audio` et `expo-video`.

## Installation

```bash
npm install expo-audio
# ou
npx expo install expo-audio
```

## Changements d'API

### 1. Lecture Audio (Sound)

**Ancien (expo-av):**
```typescript
import { Audio } from 'expo-av';

const { sound } = await Audio.Sound.createAsync(
  { uri: audioUri },
  { shouldPlay: true, isLooping: true, volume: 0.5 }
);
sound.setOnPlaybackStatusUpdate((status) => { ... });
await sound.playAsync();
await sound.pauseAsync();
await sound.unloadAsync();
```

**Nouveau (expo-audio):**
```typescript
import { useAudioPlayer, AudioSource } from 'expo-audio';

// Dans un composant
const player = useAudioPlayer(audioUri);
player.loop = true;
player.volume = 0.5;
player.play();
player.pause();
player.replay();

// Ou avec AudioPlayer directement
import { AudioPlayer } from 'expo-audio';
const player = new AudioPlayer(audioUri);
player.loop = true;
player.volume = 0.5;
player.play();
```

### 2. Enregistrement Audio (Recording)

**Ancien (expo-av):**
```typescript
import { Audio } from 'expo-av';

await Audio.requestPermissionsAsync();
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
});

const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

**Nouveau (expo-audio):**
```typescript
import { useAudioRecorder, AudioRecorderOptions } from 'expo-audio';

// Dans un composant
const recorder = useAudioRecorder({
  bitRate: 128000,
  sampleRate: 44100,
  numberOfChannels: 2,
  android: {
    extension: '.m4a',
    outputFormat: 2, // MPEG_4
    audioEncoder: 3, // AAC
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioQuality: 127, // High
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
});

await recorder.record();
await recorder.stop();
const uri = recorder.getURI();
```

### 3. Permissions

**Ancien:**
```typescript
await Audio.requestPermissionsAsync();
await Audio.setAudioModeAsync({ ... });
```

**Nouveau:**
```typescript
import * as Audio from 'expo-audio';

const { status } = await Audio.requestPermissionsAsync();
if (status !== 'granted') {
  // Gérer le refus
}
```

## Fichiers à migrer

1. `src/pages/BaytAnNur.tsx` - Lecture d'ambiance sonore
2. `src/pages/Journal.tsx` - Enregistrement vocal
3. `src/pages/Chat.tsx` - Enregistrement vocal
4. `src/components/challenge/JournalEntry.tsx` - Enregistrement vocal

## Notes importantes

- `expo-audio` n'a pas de `setAudioModeAsync` - la configuration se fait via les options du player/recorder
- Les callbacks de statut sont remplacés par des événements ou des hooks
- La structure des options d'enregistrement est différente

## Documentation
- https://docs.expo.dev/versions/latest/sdk/audio/
- https://docs.expo.dev/versions/latest/sdk/video/

