/**
 * Avatars prédéfinis organisés par genre
 * Les 2 premiers avatars sont pour les hommes, les 2 derniers pour les femmes
 */

export interface Avatar {
  id: string;
  image: any; // require() pour React Native
  name: string;
}

// avatar1.png et avatar2.png sont pour les hommes
// avatar3.png et avatar4.png sont pour les femmes
export const maleAvatars: Avatar[] = [
  { id: 'male-1', image: require('../../avatar/avatar1.png'), name: 'Homme 1' },
  { id: 'male-2', image: require('../../avatar/avatar2.png'), name: 'Homme 2' },
];

export const femaleAvatars: Avatar[] = [
  { id: 'female-1', image: require('../../avatar/avatar3.png'), name: 'Femme 1' },
  { id: 'female-2', image: require('../../avatar/avatar4.png'), name: 'Femme 2' },
];

export function getAvatarsByGender(gender: 'male' | 'female'): Avatar[] {
  return gender === 'male' ? maleAvatars : femaleAvatars;
}

export function getAvatarById(id: string): Avatar | undefined {
  return [...maleAvatars, ...femaleAvatars].find(avatar => avatar.id === id);
}

