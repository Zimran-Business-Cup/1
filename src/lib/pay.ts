// US pay per role from the BLS Occupational Employment and Wage Statistics
// (OEWS), May 2025. National percentiles; metro and industry figures are
// medians. Collected via the WageDex mirror of the BLS files, with spot checks
// against the BLS Public Data API (see research_notes/.../pay_data_notes.md).
// Wages only: bonuses and equity are excluded.

export interface RolePay {
  soc: string;
  occupation: string;
  year: string;
  proxy?: string;
  percentiles: { p10: number | null; p25: number | null; median: number | null; p75: number | null; p90: number | null };
  metros: { name: string; median: number }[];
  industries: { name: string; median: number }[];
  source: string;
}

const src = (major: string, occ: string) =>
  `https://data.bls.gov/oesprofile/?year=2025&major_group=${major}&occupation=${occ}&measure=01&areas=INDUSTRY,STATE,MSA`;

const PROJECT_MGMT: Omit<RolePay, "proxy"> = {
  soc: "13-1082",
  occupation: "Project Management Specialists",
  year: "May 2025",
  percentiles: { p10: 61580, p25: 78440, median: 102320, p75: 133100, p90: 167970 },
  metros: [
    { name: "Dothan, AL", median: 135260 },
    { name: "San Jose, CA", median: 135120 },
    { name: "San Francisco, CA", median: 135040 },
  ],
  industries: [
    { name: "Tech services", median: 125100 },
    { name: "Corporate HQs", median: 124180 },
    { name: "Engineering firms", median: 107050 },
  ],
  source: src("130000", "131082"),
};

export const PAY: Record<string, RolePay> = {
  "backend-engineer": {
    soc: "15-1252",
    occupation: "Software Developers",
    year: "May 2025",
    percentiles: { p10: 82460, p25: 105210, median: 135980, p75: 171980, p90: 214670 },
    metros: [
      { name: "San Jose, CA", median: 213110 },
      { name: "San Francisco, CA", median: 186640 },
      { name: "Seattle, WA", median: 167280 },
    ],
    industries: [
      { name: "Software companies", median: 164550 },
      { name: "Corporate HQs", median: 135680 },
      { name: "Tech services", median: 132050 },
    ],
    source: src("150000", "151252"),
  },
  "frontend-developer": {
    soc: "15-1254",
    occupation: "Web Developers",
    year: "May 2025",
    percentiles: { p10: 48100, p25: 64230, median: 92650, p75: 126230, p90: 162290 },
    metros: [
      { name: "San Jose, CA", median: 166670 },
      { name: "San Francisco, CA", median: 152450 },
      { name: "Washington, DC", median: 134350 },
    ],
    industries: [
      { name: "Software companies", median: 130440 },
      { name: "Corporate HQs", median: 108120 },
      { name: "Tech services", median: 88690 },
    ],
    source: src("150000", "151254"),
  },
  "data-analyst": {
    soc: "15-2051",
    occupation: "Data Scientists",
    year: "May 2025",
    proxy: "BLS has no separate data analyst category; Data Scientists likely runs higher than typical analyst pay.",
    percentiles: { p10: 67240, p25: 85660, median: 120230, p75: 158880, p90: 199130 },
    metros: [
      { name: "San Jose, CA", median: 185080 },
      { name: "San Francisco, CA", median: 170110 },
      { name: "Idaho Falls, ID", median: 167840 },
    ],
    industries: [
      { name: "Tech services", median: 132380 },
      { name: "Banks and lenders", median: 130300 },
      { name: "Corporate HQs", median: 128050 },
    ],
    source: src("150000", "152051"),
  },
  "product-designer": {
    soc: "15-1255",
    occupation: "Web and Digital Interface Designers",
    year: "May 2025",
    percentiles: { p10: 53750, p25: 73290, median: 104000, p75: 158820, p90: 201550 },
    metros: [
      { name: "San Jose, CA", median: 201260 },
      { name: "San Francisco, CA", median: 163810 },
      { name: "Boulder, CO", median: 139900 },
    ],
    industries: [
      { name: "Software companies", median: 129050 },
      { name: "Tech services", median: 109990 },
      { name: "Ad and PR agencies", median: 72520 },
    ],
    source: src("150000", "151255"),
  },
  "graphic-designer": {
    soc: "27-1024",
    occupation: "Graphic Designers",
    year: "May 2025",
    percentiles: { p10: 39520, p25: 49040, median: 62960, p75: 81830, p90: 104910 },
    metros: [
      { name: "San Jose, CA", median: 97360 },
      { name: "San Francisco, CA", median: 92050 },
      { name: "Washington, DC", median: 85420 },
    ],
    industries: [
      { name: "Corporate HQs", median: 78530 },
      { name: "Design studios", median: 63780 },
      { name: "Ad and PR agencies", median: 61200 },
    ],
    source: src("270000", "271024"),
  },
  "marketing-specialist": {
    soc: "13-1161",
    occupation: "Market Research Analysts and Marketing Specialists",
    year: "May 2025",
    percentiles: { p10: 43390, p25: 58350, median: 78760, p75: 108310, p90: 155480 },
    metros: [
      { name: "San Jose, CA", median: 141960 },
      { name: "San Francisco, CA", median: 123250 },
      { name: "Boston, MA", median: 102390 },
    ],
    industries: [
      { name: "Tech services", median: 101030 },
      { name: "Corporate HQs", median: 99850 },
      { name: "Ad and PR agencies", median: 76660 },
    ],
    source: src("130000", "131161"),
  },
  "business-development-manager": {
    soc: "41-3091",
    occupation: "Sales Representatives of Services",
    year: "May 2025",
    proxy: "BLS has no business development category. Shown: entry-level sales of services; Sales Managers (11-2022), the senior step, have a $148,270 median.",
    percentiles: { p10: 37980, p25: 47670, median: 69990, p75: 100480, p90: 148840 },
    metros: [
      { name: "San Jose, CA", median: 116510 },
      { name: "Boulder, CO", median: 99990 },
      { name: "San Francisco, CA", median: 96960 },
    ],
    industries: [
      { name: "Software companies", median: 98540 },
      { name: "Tech services", median: 97780 },
      { name: "Consulting firms", median: 77980 },
    ],
    source: src("410000", "413091"),
  },
  "product-manager": {
    ...PROJECT_MGMT,
    proxy: "BLS has no product manager category; this is the project management benchmark, likely below tech product manager pay.",
  },
  "project-manager": PROJECT_MGMT,
};
