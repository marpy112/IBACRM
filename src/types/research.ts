export interface ResearcherEntry {
  name: string;
  degree: string;
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
