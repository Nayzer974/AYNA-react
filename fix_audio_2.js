const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'BaytAnNur.tsx');

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // Normalize line endings to LF for matching
  // We'll write back with LF which is fine for JS/TS
  content = content.replace(/\r\n/g, '\n');

  // Logic block to find (from step 255)
  // Be careful with escape characters in string
  const oldLogic = `    // Démarrer l'ambiance sonore si sélectionnée
    if (session?.soundAmbiance && session.soundAmbiance !== 'silence') {
      try {
        const audioUri = await getAudioUri(session.soundAmbiance);
        if (audioUri) {
          // Libérer l'ancien player en mettant la source à null
          setAudioSource(null);
          
          // Attendre un peu pour que le player soit libéré
          await new Promise(resolve => setTimeout(resolve, 200));

          // Mettre à jour la source audio (le hook useAudioPlayer se mettra à jour automatiquement)
          const source = typeof audioUri === 'number' ? audioUri : audioUri;
          setAudioSource(source);
          
          // Le useEffect se chargera de démarrer la lecture automatiquement
        } else {
          console.warn('[BaytAnNur] URI audio non trouvée pour:', session.soundAmbiance);
        }
      } catch (err) {
        console.error('[BaytAnNur] Erreur lors du chargement de l\\'audio:', err);
        // Continuer même si l'audio ne peut pas être chargé
      }
    }`;

  const newLogic = `    // Démarrer l'ambiance sonore si sélectionnée
    if (session?.soundAmbiance && session.soundAmbiance !== 'silence') {
      try {
        const audioUri = await getAudioUri(session.soundAmbiance);
        if (audioUri) {
          // Arrêter l'ancien son si existant
          if (sound) {
            await sound.unloadAsync();
          }
          
          // Charger et jouer le nouveau son
          const newSound = await loadAndPlayAudio(
            typeof audioUri === 'number' ? audioUri : audioUri,
            {
              title: \`Méditation - \${session.divineName?.transliteration || 'Bayt An Nur'}\`,
              artist: 'AYNA',
              album: 'Bayt An Nur',
              duration: finalDuration * 60,
            }
          );
          
          setSound(newSound);
          setIsAudioLoaded(true);
        } else {
          console.warn('[BaytAnNur] URI audio non trouvée pour:', session.soundAmbiance);
        }
      } catch (err) {
        console.error('[BaytAnNur] Erreur lors du chargement de l\\'audio:', err);
        // Continuer même si l'audio ne peut pas être chargé
      }
    }`;

  if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newLogic);
    console.log('Fixed handleStartSession logic');
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.error('Could not find old handleStartSession logic block (even with normalized newlines)');
  }

} catch (err) {
  console.error('Error:', err);
}
