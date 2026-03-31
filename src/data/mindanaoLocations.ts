import type { ResearchLocation } from '../types/research';

export const MINDANAO_RESEARCH_LOCATIONS: ResearchLocation[] = [
  {
    id: 'davao-city',
    name: 'Davao City Research Hub',
    latitude: 7.0731,
    longitude: 125.6121,
    radiusKm: 15,
    researches: [
      {
        id: 'davao-city-urban-ecology',
        title: 'Urban Ecology and Biodiversity',
        description: 'Urban ecology and biodiversity research center in Mindanao\'s largest city',
        researchers: [
          { name: 'Dr. Maria Santos', degree: '' },
          { name: 'Dr. Juan Cruz', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'mount-apo',
    name: 'Mount Apo Field Station',
    latitude: 6.9919,
    longitude: 125.3631,
    radiusKm: 12,
    researches: [
      {
        id: 'mount-apo-high-altitude',
        title: 'High-Altitude Ecosystem Study',
        description: 'High-altitude ecosystem research facility on the Philippines\' highest peak',
        researchers: [
          { name: 'Prof. Antonio Lopez', degree: '' },
          { name: 'Dr. Rosa Garcia', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'bukidnon',
    name: 'Bukidnon Agricultural Research Center',
    latitude: 8.4545,
    longitude: 124.8389,
    radiusKm: 20,
    researches: [
      {
        id: 'bukidnon-agriculture',
        title: 'Sustainable Agriculture and Crop Development',
        description: 'Sustainable agriculture and crop development research station',
        researchers: [
          { name: 'Dr. Miguel Torres', degree: '' },
          { name: 'Dr. Ana Reyes', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'cotabato',
    name: 'Cotabato Wetlands Study Area',
    latitude: 6.2189,
    longitude: 124.7281,
    radiusKm: 25,
    researches: [
      {
        id: 'cotabato-wetlands-monitoring',
        title: 'Wetland Ecology and Bird Monitoring',
        description: 'Wetland ecology and migratory bird monitoring site',
        researchers: [
          { name: 'Dr. Ricardo Flores', degree: '' },
          { name: 'Dr. Carmen Ramos', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'zamboanga',
    name: 'Zamboanga Marine Research Institute',
    latitude: 6.9271,
    longitude: 122.0724,
    radiusKm: 30,
    researches: [
      {
        id: 'zamboanga-marine-biodiversity',
        title: 'Coastal and Marine Biodiversity',
        description: 'Coastal and marine biodiversity research facility',
        researchers: [
          { name: 'Prof. Fernando Diaz', degree: '' },
          { name: 'Dr. Isabel Morales', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'misamis',
    name: 'Misamis Oriental Forest Reserve',
    latitude: 8.7533,
    longitude: 124.6431,
    radiusKm: 22,
    researches: [
      {
        id: 'misamis-forest-conservation',
        title: 'Forest Conservation and Wildlife Research',
        description: 'Tropical forest conservation and wildlife research station',
        researchers: [
          { name: 'Dr. Pablo Mendez', degree: '' },
          { name: 'Dr. Sofia Rojas', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'lanao',
    name: 'Lake Lanao Research Center',
    latitude: 8.0,
    longitude: 124.25,
    radiusKm: 18,
    researches: [
      {
        id: 'lanao-freshwater-ecosystem',
        title: 'Freshwater Ecosystem and Endemic Species',
        description: 'Freshwater aquatic research and endemic species study',
        researchers: [
          { name: 'Dr. Marcos Gutierrez', degree: '' },
          { name: 'Dr. Elena Vargas', degree: '' },
        ],
      },
    ],
  },
  {
    id: 'surigao',
    name: 'Surigao Geological Research Station',
    latitude: 9.7624,
    longitude: 125.5047,
    radiusKm: 16,
    researches: [
      {
        id: 'surigao-geological-hazards',
        title: 'Geological Hazard and Mineral Assessment',
        description: 'Mineral resources and geological hazard assessment research',
        researchers: [
          { name: 'Prof. Luis Castro', degree: '' },
          { name: 'Dr. Beatriz Silva', degree: '' },
        ],
      },
    ],
  },
];
