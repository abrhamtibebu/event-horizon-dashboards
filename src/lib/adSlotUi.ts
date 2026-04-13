/** Groups for sorting preset slot cards in the Advertising admin UI */
export const SLOT_GROUP_ORDER = [
  'Home',
  'Browse & discover',
  'Event pages',
  'Categories',
  'Map',
  'Profile',
  'Other',
] as const

export function slotUiGroup(key: string): (typeof SLOT_GROUP_ORDER)[number] {
  if (key.startsWith('home_')) return 'Home'
  if (key.startsWith('browse_')) return 'Browse & discover'
  if (key.startsWith('event_detail')) return 'Event pages'
  if (key.startsWith('categories_')) return 'Categories'
  if (key.startsWith('map_')) return 'Map'
  if (key.startsWith('profile_')) return 'Profile'
  return 'Other'
}

export function groupIndex(key: string): number {
  const g = slotUiGroup(key)
  return SLOT_GROUP_ORDER.indexOf(g)
}
