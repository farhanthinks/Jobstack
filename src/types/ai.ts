export interface MatchScoreResult {
  score: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
}

export interface MissingSkillsResult {
  matchedSkills: string[];
  missingSkills: string[];
}

export interface AtsResumeResult {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tailoredLatex: string;
}

export interface CoverLetterResult {
  coverLetter: string;
}

export interface InterviewQuestionsResult {
  phone: string[];
  technical: string[];
  hr: string[];
  final: string[];
}
