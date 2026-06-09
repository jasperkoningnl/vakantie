'use client'

import { useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  AlertCircle,
  Ambulance,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Baby,
  Backpack,
  BookOpen,
  CalendarDays,
  Car,
  Castle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  ClipboardCheck,
  Droplets,
  Edit3,
  ExternalLink,
  Flag,
  Gift,
  Home,
  Hospital,
  Hotel,
  Info,
  Languages,
  Lightbulb,
  LogIn,
  Map,
  MapPin,
  MousePointer2,
  Navigation,
  PartyPopper,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Route,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  TreePine,
  Utensils,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  add: Plus,
  add_circle: CirclePlus,
  arrow_back: ArrowLeft,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,
  attractions: Gift,
  auto_awesome: Sparkles,
  backpack: Backpack,
  bakery_dining: Store,
  castle: Castle,
  celebration: PartyPopper,
  check: Check,
  check_circle: CheckCircle,
  checklist: ClipboardCheck,
  chevron_right: ChevronRight,
  child_care: Baby,
  close: X,
  description: ClipboardCheck,
  directions_car: Car,
  edit_note: Edit3,
  emergency: Ambulance,
  error: AlertCircle,
  event: CalendarDays,
  expand_more: ChevronDown,
  flag: Flag,
  forest: TreePine,
  holiday_village: Home,
  home: Home,
  hotel: Hotel,
  info: Info,
  install_mobile: Phone,
  language: Languages,
  lightbulb: Lightbulb,
  local_gas_station: Droplets,
  local_hospital: Hospital,
  login: LogIn,
  map: Map,
  menu_book: BookOpen,
  museum: Castle,
  my_location: MousePointer2,
  navigation: Navigation,
  near_me: Navigation,
  open_in_new: ExternalLink,
  phone_iphone: Phone,
  photo_library: BookOpen,
  place: MapPin,
  print: Printer,
  refresh: RefreshCw,
  restaurant: Utensils,
  route: Route,
  shopping_bag: ShoppingBag,
  shopping_cart: ShoppingCart,
  sync: RefreshCw,
  sync_problem: AlertCircle,
  tips_and_updates: Lightbulb,
  volume_up: Volume2,
  water_drop: Droplets,
}

type IconElement = HTMLElement & {
  __materialIconName?: string
  __materialIconRoot?: Root
}

function getIconName(element: HTMLElement) {
  const renderedText = (element.textContent || '').trim()
  return renderedText || element.dataset.icon || ''
}

function renderIcon(element: IconElement) {
  const name = getIconName(element)
  const Icon = ICONS[name] || Stethoscope

  if (element.__materialIconName === name && element.__materialIconRoot) return

  element.__materialIconRoot?.unmount()
  element.__materialIconName = name
  element.dataset.icon = name
  element.setAttribute('aria-hidden', 'true')
  element.textContent = ''

  const root = createRoot(element)
  element.__materialIconRoot = root
  root.render(<Icon aria-hidden="true" focusable="false" strokeWidth={2.35} />)
}

function renderMaterialIcons() {
  document.querySelectorAll<IconElement>('.material-symbols-outlined').forEach(renderIcon)
}

export function MaterialIconHydrator() {
  useEffect(() => {
    renderMaterialIcons()

    const observer = new MutationObserver(renderMaterialIcons)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }, [])

  return null
}
