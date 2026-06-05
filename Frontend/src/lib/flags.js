// Country flag map for the Moroccan tournament context.
// Keys are 2-letter codes; values are { emoji, name }.

export const FLAGS = {
  MA: { emoji: '🇲🇦', name: 'Maroc' },
  SN: { emoji: '🇸🇳', name: 'Sénégal' },
  CI: { emoji: '🇨🇮', name: 'Côte d\'Ivoire' },
  EG: { emoji: '🇪🇬', name: 'Égypte' },
  DZ: { emoji: '🇩🇿', name: 'Algérie' },
  NG: { emoji: '🇳🇬', name: 'Nigéria' },
  CM: { emoji: '🇨🇲', name: 'Cameroun' },
  TN: { emoji: '🇹🇳', name: 'Tunisie' },
  GH: { emoji: '🇬🇭', name: 'Ghana' },
  ML: { emoji: '🇲🇱', name: 'Mali' },
};

export const FLAG_LIST = Object.entries(FLAGS).map(([code, v]) => ({ code, ...v }));
