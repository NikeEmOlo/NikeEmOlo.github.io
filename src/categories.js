// Project categories, in nav display order (first = leftmost tab).
// This is the single source of truth: the content schema validates against it,
// and the navigation renders tabs in this order.
export const CATEGORIES = ['development', 'delivery', 'operations']

// Per-category display label and deck palette for the /projects page. Each
// gradient stays within the existing brand hues (teal / purple / orange are
// all already tokens in global.css) rather than introducing new colors — the
// three categories just get a distinct weighting of the palette so the deck
// reads as visibly re-themed without breaking brand consistency.
export const CATEGORY_META = {
    development: {
        label: 'Development',
        description: 'Full-stack builds, tooling, and this site itself.',
        gradient: 'linear-gradient(0.3turn, #2A9D8F 0%, #359E9D 50%, #7ECECE 100%)',
        accent: '#7ECECE',
    },
    delivery: {
        label: 'Delivery',
        description: 'Client-facing programmes, shipped and supported.',
        gradient: 'linear-gradient(0.3turn, #704898 0%, #7B4FA6 50%, #BE83D3 100%)',
        accent: '#BE83D3',
    },
    operations: {
        label: 'Operations',
        description: 'Process fixes and the systems behind the work.',
        gradient: 'linear-gradient(0.3turn, #C85F22 0%, #E8722C 50%, #F4A468 100%)',
        accent: '#F4A468',
    },
}
