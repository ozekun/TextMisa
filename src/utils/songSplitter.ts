/**
 * Helper utility to split lyric text into slides (maximum 2 lines per slide)
 * and prepend verse numbering tags <nr>X</nr> on the first slide of each verse.
 */

export interface Slide {
  text: string;
  type: "reff" | "ayat" | "ordinarium";
  label: string; // e.g. "Reff", "Ayat 1", "Bait"
}

// Helper to fix ALL CAPS text to sentence case, preserving common Catholic terms
function fixCapslock(text: string): string {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return text;

  const upperCount = letters.split('').filter(c => c === c.toUpperCase()).length;
  // Jika lebih dari 60% huruf besar, anggap sebagai capslock
  if (upperCount / letters.length < 0.6) return text;

  let lower = text.toLowerCase();
  
  // Huruf pertama setiap baris jadi huruf besar
  let formatted = lower.split('\n').map(line => {
    return line.replace(/([a-z])/, match => match.toUpperCase());
  }).join('\n');

  // Kamus kata-kata khusus yang harus selalu huruf besar awalnya
  const dict = [
    "Tuhan", "Allah", "Yesus", "Kristus", "Roh", "Kudus", "Bapa", "Putra", 
    "Bunda", "Maria", "Santo", "Santa", "Perawan", "Bait", "Reff",
    "Puji", "Syukur", "Amin", "Haleluya", "Hosana", "Kyrie", "Eleison", "Christe"
  ];
  
  dict.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    formatted = formatted.replace(regex, word);
  });

  return formatted;
}

// Helper to wrap text so lines don't exceed max length
// firstLineMax digunakan untuk baris pertama yang mungkin memiliki tag <nr> (kotak nomor)
function wordWrap(text: string, firstLineMax: number = 26, restMax: number = 26): string[] {
  const words = text.split(/[ \t]+/);
  const lines: string[] = [];
  let currentLine = "";
  let isFirstLine = true;

  for (const word of words) {
    const currentMax = isFirstLine ? firstLineMax : restMax;

    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= currentMax) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      isFirstLine = false;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
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
  let sanitizedText = text.replace(/[^\p{L}\p{N} \n\r\t\.,':\-]/gu, '');
  
  // Fix Capslock if necessary
  sanitizedText = fixCapslock(sanitizedText);

  // Normalize newlines and split by double newlines to form distinct blocks/stanzas
  const normalizedText = sanitizedText.replace(/\r\n/g, '\n');
  const blocks = normalizedText.split(/\n\s*\n/);

  const slides: Slide[] = [];
  let currentSlideIndex = 0; // to keep track of slide count for the label

  blocks.forEach((block, blockIndex) => {
    if (!block.trim()) return;

    // Split user's explicit newlines inside the block first
    const rawLines = block
      .split("\n")
      .map((line) => line.trim().replace(/ {2,}/g, ' '))
      .filter((line) => line.length > 0);

    const lines: string[] = [];
    rawLines.forEach((line, lineIndex) => {
      // Jika ini adalah baris pertama dari block pertama di bagian Ayat, baris ini akan menerima tag <nr>
      const willGetNr = (type === "ayat" && blockIndex === 0 && lineIndex === 0 && verseNumber !== undefined);
      
      // Berikan batas 23 karakter untuk baris pertama (agar muat dengan kotak nomor ayat)
      // dan 26 karakter untuk baris lainnya agar konsisten.
      const firstLineMax = willGetNr ? 23 : 26;
      const restMax = 26;
      
      const wrapped = wordWrap(line, firstLineMax, restMax);
      lines.push(...wrapped);
    });

    // Group lines of this specific block into pairs of max 2 lines
    for (let i = 0; i < lines.length; i += 2) {
      const pair = lines.slice(i, i + 2);
      let slideText = pair.join("\n");

      // Prepend <nr>X</nr> only to the FIRST slide of the verse (type: "ayat")
      // Only do this on the very first block and first pair
      if (type === "ayat" && blockIndex === 0 && i === 0 && verseNumber !== undefined) {
        slideText = `<nr>${verseNumber}</nr> ` + slideText;
      }

      currentSlideIndex++;
      slides.push({
        text: slideText,
        type,
        label: type === "ayat" ? `Ayat ${verseNumber} (S${currentSlideIndex})` : `${label} (S${currentSlideIndex})`,
      });
    }
  });

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
