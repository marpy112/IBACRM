export interface ResearcherEntry {
  name: string;
  degree: string;
  age?: number;
  photo?: string;
}

export interface ResearchEntry {
  id: string;
  title: string;
  description: string;
  researchers: ResearcherEntry[];
  locationIds?: string[];
}

export interface ResearchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  researches: ResearchEntry[];
}
