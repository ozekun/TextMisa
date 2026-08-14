/**
 * Helper utility to split lyric text into slides (maximum 2 lines per slide)
 * and prepend verse numbering tags <nr>X</nr> on the first slide of each verse.
 */

export interface Slide {
  text: string;
  type: "reff" | "ayat" | "ordinarium";
  label: string; // e.g. "Reff", "Ayat 1", "Bait"
}

// Splits a text block into slides of max 2 lines each
export function splitBlockToSlides(
  text: string | null | undefined,
  type: "reff" | "ayat" | "ordinarium",
  label: string,
  verseNumber?: number
): Slide[] {
  if (!text || !text.trim()) return [];

  // Sanitize text: remove weird icons and unprintable characters
  // Keep letters, numbers, standard spaces/newlines, and ONLY these punctuation: , . ' :
  const sanitizedText = text.replace(/[^\p{L}\p{N} \n\r\t\.,':]/gu, '');

  // Split lines and filter out empty ones
  const lines = sanitizedText
    .split("\n")
    .map((line) => line.trim().replace(/ {2,}/g, ' ')) // Also clean up multiple spaces
    .filter((line) => line.length > 0);

  const slides: Slide[] = [];

  // Group lines into pairs of max 2 lines
  for (let i = 0; i < lines.length; i += 2) {
    const pair = lines.slice(i, i + 2);
    let slideText = pair.join("\n");

    // Prepend <nr>X</nr> only to the FIRST slide of the verse (type: "ayat")
    if (type === "ayat" && i === 0 && verseNumber !== undefined) {
      slideText = `<nr>${verseNumber}</nr> ` + slideText;
    }

    slides.push({
      text: slideText,
      type,
      label: type === "ayat" ? `Ayat ${verseNumber} (S${Math.floor(i / 2) + 1})` : `${label} (S${Math.floor(i / 2) + 1})`,
    });
  }

  return slides;
}

// Combines Reff and Ayat slides based on the susunan_nyanyi (sequence pattern)
export function generateSlideSequence(params: {
  kategori: string;
  teksReff?: string;
  teksAyat1: string;
  ayatTambahan: string[]; // parsed from json_ayat_tambahan
  susunanNyanyi?: string;
}): Slide[] {
  const { kategori, teksReff = "", teksAyat1, ayatTambahan, susunanNyanyi = "ayat-only" } = params;

  // Ordinarium categories (Kyrie, Gloria, Sanctus, Agnus Dei)
  const isOrdinarium = ["Kyrie", "Gloria", "Sanctus", "Agnus Dei"].includes(kategori);
  if (isOrdinarium) {
    return splitBlockToSlides(teksAyat1, "ordinarium", kategori);
  }

  // Pre-split the blocks
  const reffSlides = splitBlockToSlides(teksReff, "reff", "Reff");
  const ayat1Slides = splitBlockToSlides(teksAyat1, "ayat", "Ayat 1", 1);

  const additionalAyatSlides = ayatTambahan.map((txt, index) =>
    splitBlockToSlides(txt, "ayat", `Ayat ${index + 2}`, index + 2)
  );

  const allAyatSlides = [ayat1Slides, ...additionalAyatSlides];

  let sequenceSlides: Slide[] = [];

  // Generate sequence based on susunan_nyanyi
  switch (susunanNyanyi) {
    case "reff-ayat-reff":
      // Reff -> Ayat 1 -> Reff -> Ayat 2 -> Reff ...
      allAyatSlides.forEach((ayatSlides) => {
        sequenceSlides.push(...reffSlides);
        sequenceSlides.push(...ayatSlides);
      });
      if (allAyatSlides.length > 0) {
        sequenceSlides.push(...reffSlides);
      }
      break;

    case "ayat-reff-ayat":
      // Ayat 1 -> Reff -> Ayat 2 -> Reff ...
      allAyatSlides.forEach((ayatSlides, index) => {
        sequenceSlides.push(...ayatSlides);
        sequenceSlides.push(...reffSlides);
      });
      break;

    case "reff-ayat":
      // Reff -> Ayat 1 -> Ayat 2 ...
      sequenceSlides.push(...reffSlides);
      allAyatSlides.forEach((ayatSlides) => {
        sequenceSlides.push(...ayatSlides);
      });
      break;

    case "ayat-reff":
      // Ayat 1 -> Ayat 2 ... -> Reff
      allAyatSlides.forEach((ayatSlides) => {
        sequenceSlides.push(...ayatSlides);
      });
      sequenceSlides.push(...reffSlides);
      break;

    case "reff-only":
      sequenceSlides.push(...reffSlides);
      break;

    case "ayat-only":
    default:
      // Ayat 1 -> Ayat 2 ...
      allAyatSlides.forEach((ayatSlides) => {
        sequenceSlides.push(...ayatSlides);
      });
      break;
  }

  return sequenceSlides;
}
