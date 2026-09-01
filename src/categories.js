// Project categories, in nav display order (first = leftmost tab).
// This is the single source of truth: the content schema validates against it,
// and the navigation renders tabs in this order.
export const CATEGORIES = ['development', 'delivery', 'operations']

// Per-category display label and deck accent for the home page. Accents are
// drawn from the doodle-pop palette (global.css) — cyan stays reserved as
// the site's primary/active-state color, so each category gets one of the
// other three.
export const CATEGORY_META = {
    development: {
        label: 'Development',
        description: 'Full-stack builds, tooling, and this site itself.',
        gradient: 'linear-gradient(0.3turn, #88A600 0%, #D1FF00 50%, #E5FF66 100%)',
        accent: '#D1FF00',
    },
    delivery: {
        label: 'Delivery',
        description: 'Client-facing programmes, shipped and supported.',
        gradient: 'linear-gradient(0.3turn, #A61449 0%, #FF1F70 50%, #FF6FA0 100%)',
        accent: '#FF1F70',
    },
    operations: {
        label: 'Operations',
        description: 'Process fixes and the systems behind the work.',
        gradient: 'linear-gradient(0.3turn, #A68E00 0%, #FFDA00 50%, #FFE666 100%)',
        accent: '#FFDA00',
    },
}
