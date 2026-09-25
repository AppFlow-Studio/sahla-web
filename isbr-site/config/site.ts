export const site = {
  // Values from the mosque's official papers. Do not change them.
  legalName: "Islamic Society Of Bay Ridge, Inc.", // exact: capital O, comma, period
  commonName: "Islamic Society of Bay Ridge",
  shortName: "ISBR",
  masjidName: "Masjid Musab bin Umayr",
  masjidNameArabic: "مسجد مصعب بن عمير",
  streetAddress: "6807 5th Avenue",
  city: "Brooklyn",
  state: "NY",
  postalCode: "11220",
  phone: "+1-718-680-0121",
  phoneDisplay: "(718) 680-0121",
  email: "isbr6807@gmail.com",
  facebookUrl: "https://www.facebook.com/IslamicSocietyBayRidge/",
  foundedYear: "1993",
  foundedDate: "1993-02-09", // for JSON-LD only
  boardMemberName: "Mohamed Elnashar",
  boardMemberTitle: "Executive Director",

  // The website address. Change this ONE line if the domain changes later.
  url: "https://isbr.sahla.co",
} as const;

export const fullAddress = `${site.streetAddress}, ${site.city}, ${site.state} ${site.postalCode}`;
