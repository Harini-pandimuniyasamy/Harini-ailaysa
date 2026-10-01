export interface DiffBlock {
  type: 'unchanged' | 'removed' | 'added' | 'changed';
  originalText: string;
  cleanedText: string;
  changeType?: string;
}

export function computeDiff(original: string, cleaned: string): DiffBlock[] {
  // Simple word/token based diff
  // Tokenize by word boundaries including spaces
  const tokenize = (str: string) => str.match(/(\s+|[^\s]+)/g) || [];
  
  const tokens1 = tokenize(original);
  const tokens2 = tokenize(cleaned);

  const m = tokens1.length;
  const n = tokens2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tokens1[i - 1] === tokens2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const rawDiff: { type: 'added' | 'removed' | 'unchanged', text: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokens1[i - 1] === tokens2[j - 1]) {
      rawDiff.unshift({ type: 'unchanged', text: tokens1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.unshift({ type: 'added', text: tokens2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.unshift({ type: 'removed', text: tokens1[i - 1] });
      i--;
    }
  }

  // Combine contiguous blocks
  const combined: DiffBlock[] = [];
  
  for (const block of rawDiff) {
    const last = combined[combined.length - 1];
    if (last && last.type === 'unchanged' && block.type === 'unchanged') {
      last.originalText += block.text;
      last.cleanedText += block.text;
    } else if (last && last.type === 'removed' && block.type === 'removed') {
      last.originalText += block.text;
    } else if (last && last.type === 'added' && block.type === 'added') {
      last.cleanedText += block.text;
    } else if (last && last.type === 'removed' && block.type === 'added') {
      last.type = 'changed';
      last.cleanedText += block.text;
    } else if (last && last.type === 'added' && block.type === 'removed') {
      last.type = 'changed';
      last.originalText = block.text + last.originalText; // prepend since we had added first
    } else {
      if (block.type === 'unchanged') {
        combined.push({ type: 'unchanged', originalText: block.text, cleanedText: block.text });
      } else if (block.type === 'removed') {
        combined.push({ type: 'removed', originalText: block.text, cleanedText: '' });
      } else if (block.type === 'added') {
        combined.push({ type: 'added', originalText: '', cleanedText: block.text });
      }
    }
  }

  // Identify change types
  for (const block of combined) {
    if (block.type === 'changed') {
      if (block.originalText.trim() === '' && block.cleanedText.trim() === '') {
        block.changeType = 'Spacing corrected';
      } else if (block.originalText.toLowerCase() === block.cleanedText.toLowerCase()) {
        block.changeType = 'Formatting refined';
      } else if (block.originalText.includes('\n') || block.cleanedText.includes('\n')) {
        block.changeType = 'Line break corrected';
      } else {
        block.changeType = 'Text corrected';
      }
    } else if (block.type === 'removed') {
      if (block.originalText.trim() === '') {
        block.changeType = block.originalText.includes('\n') ? 'Blank lines removed' : 'Extra spaces removed';
      } else {
        block.changeType = 'Artifacts removed';
      }
    } else if (block.type === 'added') {
      block.changeType = 'Content adjusted';
    }
  }

  return combined;
}
