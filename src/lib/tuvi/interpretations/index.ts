export type InterpretationSource = {
  book: string;
  author: string;
  translator?: string | null;
};

export type StarInterpretation = {
  star_id: string;
  star_name: string;
  branches: string[];
  branch_names: string[];
  text: string;
  source: InterpretationSource;
};

export type PalaceInterpretations = {
  palace: string;
  palace_name: string;
  interpretations: StarInterpretation[];
};

// Knowledge data removed - using AI streaming instead
const palaceDataMap: Record<string, PalaceInterpretations> = {};

export function getInterpretations(
  palaceId: string,
  starId: string,
  branch?: string
): StarInterpretation[] {
  const palaceData = palaceDataMap[palaceId];
  if (!palaceData) return [];

  return palaceData.interpretations.filter((item) => {
    const matchStar = item.star_id === starId;
    const matchBranch = !branch || item.branches.includes(branch);
    return matchStar && matchBranch;
  });
}

export function formatSource(source: InterpretationSource): string {
  const parts = [source.book, source.author];
  if (source.translator) {
    parts.push(`${source.translator} biên dịch`);
  }
  return parts.join(" - ");
}
