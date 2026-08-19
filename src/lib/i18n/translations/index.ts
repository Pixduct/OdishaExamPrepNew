import { commonTranslations } from './common';
import { homeTranslations } from './home';
import { examsTranslations } from './exams';
import { testEngineTranslations } from './testEngine';
import { aiMentorTranslations } from './aiMentor';
import { analyticsTranslations } from './analytics';
import { currentAffairsTranslations } from './currentAffairs';
import { Language } from '../types';

export const translations: Record<Language, Record<string, any>> = {
  en: {
    common: commonTranslations.en,
    home: homeTranslations.en,
    exams: examsTranslations.en,
    test: testEngineTranslations.en,
    ai: aiMentorTranslations.en,
    analytics: analyticsTranslations.en,
    ca: currentAffairsTranslations.en
  },
  or: {
    common: commonTranslations.or,
    home: homeTranslations.or,
    exams: examsTranslations.or,
    test: testEngineTranslations.or,
    ai: aiMentorTranslations.or,
    analytics: analyticsTranslations.or,
    ca: currentAffairsTranslations.or
  }
};
