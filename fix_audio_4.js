const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'BaytAnNur.tsx');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n'); // Normalize

    // 1. Replace the stop logic
    // "          // Libérer l'ancien player en mettant la source à null\n          setAudioSource(null);"
    // Note: Indentation is important. We saw 10 spaces in view_file.
    const oldStop = `          // Libérer l'ancien player en mettant la source à null
          setAudioSource(null);`;

    const newStop = `          // Arrêter l'ancien son si existant
          if (sound) {
            await sound.unloadAsync();
          }`;

    if (content.includes(oldStop)) {
        content = content.replace(oldStop, newStop);
        console.log('Fixed stop logic');
    } else {
        // Try with variable whitespace
        console.log('Strict match for stop logic failed. Trying regex.');
        const regexStop = /\s*\/\/\s*Libérer l'ancien player[\s\S]*?setAudioSource\(null\);/;
        if (regexStop.test(content)) {
            content = content.replace(regexStop, `\n${newStop}`);
            console.log('Fixed stop logic (regex)');
        } else {
            console.error('Could not match stop logic');
        }
    }

    // 2. Replace the start logic
    // "          const source = typeof audioUri === 'number' ? audioUri : audioUri;\n          setAudioSource(source);"
    const oldStart = `          const source = typeof audioUri === 'number' ? audioUri : audioUri;
          setAudioSource(source);`;

    const newStart = `          // Charger et jouer le nouveau son
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
          setIsAudioLoaded(true);`;

    if (content.includes(oldStart)) {
        content = content.replace(oldStart, newStart);
        console.log('Fixed start logic');
    } else {
        console.log('Strict match for start logic failed. Trying regex.');
        const regexStart = /\s*const\s+source\s*=\s*typeof[\s\S]*?setAudioSource\(source\);/;
        if (regexStart.test(content)) {
            content = content.replace(regexStart, `\n${newStart}`);
            console.log('Fixed start logic (regex)');
        } else {
            console.error('Could not match start logic');
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Done');

} catch (err) {
    console.error('Error:', err);
}
