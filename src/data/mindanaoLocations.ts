export interface ResearchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  researchers: string[];
  radiusKm: number; // Research area radius in kilometers
}

export const MINDANAO_RESEARCH_LOCATIONS: ResearchLocation[] = [
  {
    id: 'davao-city',
    name: 'Davao City Research Hub',
    latitude: 7.0731,
    longitude: 125.6121,
    description: 'Urban ecology and biodiversity research center in Mindanao\'s largest city',
    researchers: ['Dr. Maria Santos', 'Dr. Juan Cruz'],
    radiusKm: 15,
  },
  {
    id: 'mount-apo',
    name: 'Mount Apo Field Station',
    latitude: 6.9919,
    longitude: 125.3631,
    description: 'High-altitude ecosystem research facility on the Philippines\' highest peak',
    researchers: ['Prof. Antonio López', 'Dr. Rosa Garcia'],
    radiusKm: 12,
  },
  {
    id: 'bukidnon',
    name: 'Bukidnon Agricultural Research Center',
    latitude: 8.4545,
    longitude: 124.8389,
    description: 'Sustainable agriculture and crop development research station',
    researchers: ['Dr. Miguel Torres', 'Dr. Ana Reyes'],
    radiusKm: 20,
  },
  {
    id: 'cotabato',
    name: 'Cotabato Wetlands Study Area',
    latitude: 6.2189,
    longitude: 124.7281,
    description: 'Wetland ecology and migratory bird monitoring site',
    researchers: ['Dr. Ricardo Flores', 'Dr. Carmen Ramos'],
    radiusKm: 25,
  },
  {
    id: 'zamboanga',
    name: 'Zamboanga Marine Research Institute',
    latitude: 6.9271,
    longitude: 122.0724,
    description: 'Coastal and marine biodiversity research facility',
    researchers: ['Prof. Fernando Diaz', 'Dr. Isabel Morales'],
    radiusKm: 30,
  },
  {
    id: 'misamis',
    name: 'Misamis Oriental Forest Reserve',
    latitude: 8.7533,
    longitude: 124.6431,
    description: 'Tropical forest conservation and wildlife research station',
    researchers: ['Dr. Pablo Mendez', 'Dr. Sofia Rojas'],
    radiusKm: 22,
  },
  {
    id: 'lanao',
    name: 'Lake Lanao Research Center',
    latitude: 8.0,
    longitude: 124.25,
    description: 'Freshwater aquatic research and endemic species study',
    researchers: ['Dr. Marcos Gutierrez', 'Dr. Elena Vargas'],
    radiusKm: 18,
  },
  {
    id: 'surigao',
    name: 'Surigao Geological Research Station',
    latitude: 9.7624,
    longitude: 125.5047,
    description: 'Mineral resources and geological hazard assessment research',
    researchers: ['Prof. Luis Castro', 'Dr. Beatriz Silva'],
    radiusKm: 16,
  },
];
