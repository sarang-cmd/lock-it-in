import { StudySet, Term } from '../types';
import { nanoid } from './utils';
import { db } from './storage';

function makeTerm(term: string, definition: string): Term {
  return {
    id: nanoid(),
    term,
    definition,
    masteryScore: 0,
    lastSeen: null,
    timesCorrect: 0,
    timesWrong: 0,
  };
}

const demoSets: Omit<StudySet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Cell Biology Basics',
    tags: ['biology', 'science'],
    terms: [
      makeTerm('Mitosis', 'Cell division producing two genetically identical daughter cells'),
      makeTerm('Meiosis', 'Cell division producing four genetically diverse haploid cells'),
      makeTerm('Mitochondria', 'The powerhouse of the cell — site of cellular respiration'),
      makeTerm('Ribosome', 'Organelle responsible for protein synthesis'),
      makeTerm('Nucleus', 'The control center of the cell containing DNA'),
      makeTerm('Endoplasmic Reticulum', 'Network of membranes involved in protein and lipid synthesis'),
      makeTerm('Golgi Apparatus', 'Modifies, packages, and ships proteins from the ER'),
      makeTerm('Cell Membrane', 'Selectively permeable phospholipid bilayer surrounding the cell'),
    ],
    sessionCount: 0,
    lastStudied: null,
    ownerId: null,
  },
  {
    name: 'Spanish Vocab — Chapter 1',
    tags: ['spanish', 'language'],
    terms: [
      makeTerm('Hola', 'Hello'),
      makeTerm('Gracias', 'Thank you'),
      makeTerm('Por favor', 'Please'),
      makeTerm('Lo siento', 'I\'m sorry'),
      makeTerm('¿Cómo estás?', 'How are you?'),
      makeTerm('Buenos días', 'Good morning'),
      makeTerm('Buenas noches', 'Good night'),
      makeTerm('¿Dónde está...?', 'Where is...?'),
      makeTerm('Me llamo...', 'My name is...'),
      makeTerm('No entiendo', 'I don\'t understand'),
    ],
    sessionCount: 2,
    lastStudied: new Date(Date.now() - 86400000 * 2).toISOString(),
    ownerId: null,
  },
];

export async function seedDemoData(): Promise<void> {
  const existing = await db.sets.getAll();
  if (existing.length > 0) return; // Don't overwrite

  const now = new Date().toISOString();
  for (const setData of demoSets) {
    const set: StudySet = {
      ...setData,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    };
    await db.sets.create(set);
  }
}
