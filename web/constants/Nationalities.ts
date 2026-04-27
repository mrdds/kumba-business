export type Nationality = {
    value: string;
    label: string;
    region: string;
};

/**
 * Complete list of nationalities in French.
 * African countries are listed first (especially West Africa / ECOWAS).
 */
export const NATIONALITIES: Nationality[] = [
    // ── Afrique de l'Ouest (priorité) ────────────────────────────────────
    { value: 'CI', label: 'Ivoirienne', region: 'Afrique de l\'Ouest' },
    { value: 'SN', label: 'Sénégalaise', region: 'Afrique de l\'Ouest' },
    { value: 'ML', label: 'Malienne', region: 'Afrique de l\'Ouest' },
    { value: 'BF', label: 'Burkinabè', region: 'Afrique de l\'Ouest' },
    { value: 'GN', label: 'Guinéenne', region: 'Afrique de l\'Ouest' },
    { value: 'NG', label: 'Nigériane', region: 'Afrique de l\'Ouest' },
    { value: 'GH', label: 'Ghanéenne', region: 'Afrique de l\'Ouest' },
    { value: 'TG', label: 'Togolaise', region: 'Afrique de l\'Ouest' },
    { value: 'BJ', label: 'Béninoise', region: 'Afrique de l\'Ouest' },
    { value: 'NE', label: 'Nigérienne', region: 'Afrique de l\'Ouest' },
    { value: 'MR', label: 'Mauritanienne', region: 'Afrique de l\'Ouest' },
    { value: 'SL', label: 'Sierra-Léonaise', region: 'Afrique de l\'Ouest' },
    { value: 'LR', label: 'Libérienne', region: 'Afrique de l\'Ouest' },
    { value: 'GW', label: 'Bissau-Guinéenne', region: 'Afrique de l\'Ouest' },
    { value: 'GM', label: 'Gambienne', region: 'Afrique de l\'Ouest' },
    { value: 'CV', label: 'Cap-Verdienne', region: 'Afrique de l\'Ouest' },

    // ── Afrique Centrale ──────────────────────────────────────────────────
    { value: 'CM', label: 'Camerounaise', region: 'Afrique Centrale' },
    { value: 'CD', label: 'Congolaise (RDC)', region: 'Afrique Centrale' },
    { value: 'CG', label: 'Congolaise (Congo-Brazzaville)', region: 'Afrique Centrale' },
    { value: 'GA', label: 'Gabonaise', region: 'Afrique Centrale' },
    { value: 'CF', label: 'Centrafricaine', region: 'Afrique Centrale' },
    { value: 'TD', label: 'Tchadienne', region: 'Afrique Centrale' },
    { value: 'GQ', label: 'Équato-Guinéenne', region: 'Afrique Centrale' },
    { value: 'ST', label: 'Santoméenne', region: 'Afrique Centrale' },

    // ── Afrique de l'Est ──────────────────────────────────────────────────
    { value: 'ET', label: 'Éthiopienne', region: 'Afrique de l\'Est' },
    { value: 'KE', label: 'Kenyane', region: 'Afrique de l\'Est' },
    { value: 'TZ', label: 'Tanzanienne', region: 'Afrique de l\'Est' },
    { value: 'UG', label: 'Ougandaise', region: 'Afrique de l\'Est' },
    { value: 'RW', label: 'Rwandaise', region: 'Afrique de l\'Est' },
    { value: 'BI', label: 'Burundaise', region: 'Afrique de l\'Est' },
    { value: 'SO', label: 'Somalienne', region: 'Afrique de l\'Est' },
    { value: 'DJ', label: 'Djiboutienne', region: 'Afrique de l\'Est' },
    { value: 'ER', label: 'Érythréenne', region: 'Afrique de l\'Est' },
    { value: 'MG', label: 'Malgache', region: 'Afrique de l\'Est' },
    { value: 'MU', label: 'Mauricienne', region: 'Afrique de l\'Est' },
    { value: 'SC', label: 'Seychelloise', region: 'Afrique de l\'Est' },
    { value: 'KM', label: 'Comorienne', region: 'Afrique de l\'Est' },

    // ── Afrique du Nord ───────────────────────────────────────────────────
    { value: 'MA', label: 'Marocaine', region: 'Afrique du Nord' },
    { value: 'DZ', label: 'Algérienne', region: 'Afrique du Nord' },
    { value: 'TN', label: 'Tunisienne', region: 'Afrique du Nord' },
    { value: 'LY', label: 'Libyenne', region: 'Afrique du Nord' },
    { value: 'EG', label: 'Égyptienne', region: 'Afrique du Nord' },
    { value: 'SD', label: 'Soudanaise', region: 'Afrique du Nord' },

    // ── Afrique Australe ──────────────────────────────────────────────────
    { value: 'ZA', label: 'Sud-Africaine', region: 'Afrique Australe' },
    { value: 'ZW', label: 'Zimbabwéenne', region: 'Afrique Australe' },
    { value: 'ZM', label: 'Zambienne', region: 'Afrique Australe' },
    { value: 'MW', label: 'Malawite', region: 'Afrique Australe' },
    { value: 'MZ', label: 'Mozambicaine', region: 'Afrique Australe' },
    { value: 'BW', label: 'Botswanaise', region: 'Afrique Australe' },
    { value: 'NA', label: 'Namibienne', region: 'Afrique Australe' },
    { value: 'LS', label: 'Lésothane', region: 'Afrique Australe' },
    { value: 'SZ', label: 'Swazi', region: 'Afrique Australe' },
    { value: 'AO', label: 'Angolaise', region: 'Afrique Australe' },

    // ── Europe ────────────────────────────────────────────────────────────
    { value: 'FR', label: 'Française', region: 'Europe' },
    { value: 'BE', label: 'Belge', region: 'Europe' },
    { value: 'CH', label: 'Suisse', region: 'Europe' },
    { value: 'DE', label: 'Allemande', region: 'Europe' },
    { value: 'GB', label: 'Britannique', region: 'Europe' },
    { value: 'IT', label: 'Italienne', region: 'Europe' },
    { value: 'ES', label: 'Espagnole', region: 'Europe' },
    { value: 'PT', label: 'Portugaise', region: 'Europe' },
    { value: 'NL', label: 'Néerlandaise', region: 'Europe' },
    { value: 'LU', label: 'Luxembourgeoise', region: 'Europe' },
    { value: 'PL', label: 'Polonaise', region: 'Europe' },
    { value: 'RO', label: 'Roumaine', region: 'Europe' },
    { value: 'SE', label: 'Suédoise', region: 'Europe' },
    { value: 'NO', label: 'Norvégienne', region: 'Europe' },
    { value: 'DK', label: 'Danoise', region: 'Europe' },
    { value: 'FI', label: 'Finlandaise', region: 'Europe' },
    { value: 'GR', label: 'Grecque', region: 'Europe' },
    { value: 'UA', label: 'Ukrainienne', region: 'Europe' },
    { value: 'RU', label: 'Russe', region: 'Europe' },

    // ── Amériques ─────────────────────────────────────────────────────────
    { value: 'US', label: 'Américaine', region: 'Amériques' },
    { value: 'CA', label: 'Canadienne', region: 'Amériques' },
    { value: 'BR', label: 'Brésilienne', region: 'Amériques' },
    { value: 'MX', label: 'Mexicaine', region: 'Amériques' },
    { value: 'CO', label: 'Colombienne', region: 'Amériques' },
    { value: 'AR', label: 'Argentine', region: 'Amériques' },
    { value: 'CL', label: 'Chilienne', region: 'Amériques' },
    { value: 'PE', label: 'Péruvienne', region: 'Amériques' },
    { value: 'VE', label: 'Vénézuélienne', region: 'Amériques' },
    { value: 'HT', label: 'Haïtienne', region: 'Amériques' },
    { value: 'CU', label: 'Cubaine', region: 'Amériques' },
    { value: 'DO', label: 'Dominicaine', region: 'Amériques' },

    // ── Asie ─────────────────────────────────────────────────────────────
    { value: 'CN', label: 'Chinoise', region: 'Asie' },
    { value: 'IN', label: 'Indienne', region: 'Asie' },
    { value: 'JP', label: 'Japonaise', region: 'Asie' },
    { value: 'KR', label: 'Sud-Coréenne', region: 'Asie' },
    { value: 'ID', label: 'Indonésienne', region: 'Asie' },
    { value: 'PK', label: 'Pakistanaise', region: 'Asie' },
    { value: 'BD', label: 'Bangladaise', region: 'Asie' },
    { value: 'VN', label: 'Vietnamienne', region: 'Asie' },
    { value: 'PH', label: 'Philippienne', region: 'Asie' },
    { value: 'TH', label: 'Thaïlandaise', region: 'Asie' },
    { value: 'MY', label: 'Malaisienne', region: 'Asie' },
    { value: 'SG', label: 'Singapourienne', region: 'Asie' },
    { value: 'TR', label: 'Turque', region: 'Asie' },
    { value: 'SA', label: 'Saoudienne', region: 'Asie' },
    { value: 'AE', label: 'Émiratie', region: 'Asie' },
    { value: 'QA', label: 'Qatarie', region: 'Asie' },
    { value: 'LB', label: 'Libanaise', region: 'Asie' },
    { value: 'SY', label: 'Syrienne', region: 'Asie' },
    { value: 'IQ', label: 'Irakienne', region: 'Asie' },
    { value: 'IR', label: 'Iranienne', region: 'Asie' },

    // ── Océanie ───────────────────────────────────────────────────────────
    { value: 'AU', label: 'Australienne', region: 'Océanie' },
    { value: 'NZ', label: 'Néo-Zélandaise', region: 'Océanie' },
];

/**
 * Nationalities grouped by region for use in optgroup selects.
 */
export const NATIONALITIES_BY_REGION = NATIONALITIES.reduce((acc, n) => {
    if (!acc[n.region]) acc[n.region] = [];
    acc[n.region].push(n);
    return acc;
}, {} as Record<string, Nationality[]>);

/**
 * Ordered list of regions (Africa first).
 */
export const NATIONALITY_REGION_ORDER = [
    "Afrique de l'Ouest",
    "Afrique Centrale",
    "Afrique de l'Est",
    "Afrique du Nord",
    "Afrique Australe",
    "Europe",
    "Amériques",
    "Asie",
    "Océanie",
];
