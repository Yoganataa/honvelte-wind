// Backward-compatibility wrappers & primary primitives
export { default as Button } from './Button.svelte'
export { default as TextField } from './TextField.svelte'
export {
  Button as ShButton,
  buttonVariants,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './button'
export { Badge, badgeVariants, type BadgeVariant } from './badge'
export { Input } from './input'
export { Separator } from './separator'
export { Alert, AlertTitle, AlertDescription } from './alert'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './dialog'

// Namespaced exports for full suite of shadcn-svelte components
export * as Accordion from './accordion'
export * as AlertPrimitive from './alert'
export * as AlertDialog from './alert-dialog'
export * as AspectRatio from './aspect-ratio'
export * as Attachment from './attachment'
export * as Avatar from './avatar'
export * as BadgePrimitive from './badge'
export * as Breadcrumb from './breadcrumb'
export * as Bubble from './bubble'
export * as ButtonGroup from './button-group'
export * as ButtonPrimitive from './button'
export * as Calendar from './calendar'
export * as Card from './card'
export * as Carousel from './carousel'
export * as Chart from './chart'
export * as Checkbox from './checkbox'
export * as CodeBlock from './code-block'
export * as Collapsible from './collapsible'
export * as Command from './command'
export * as ContextMenu from './context-menu'
export * as DialogPrimitive from './dialog'
export * as Drawer from './drawer'
export * as DropdownMenu from './dropdown-menu'
export * as Empty from './empty'
export * as Field from './field'
export * as Form from './form'
export * as HoverCard from './hover-card'
export * as InputGroup from './input-group'
export * as InputOtp from './input-otp'
export * as InputPrimitive from './input'
export * as Item from './item'
export * as Kbd from './kbd'
export * as Label from './label'
export * as Marker from './marker'
export * as Menubar from './menubar'
export * as MessageScroller from './message-scroller'
export * as Message from './message'
export * as NativeSelect from './native-select'
export * as NavigationMenu from './navigation-menu'
export * as Pagination from './pagination'
export * as Popover from './popover'
export * as Progress from './progress'
export * as Questionnaire from './questionnaire'
export * as RadioGroup from './radio-group'
export * as RangeCalendar from './range-calendar'
export * as Resizable from './resizable'
export * as ScrollArea from './scroll-area'
export * as Select from './select'
export * as SeparatorPrimitive from './separator'
export * as Sheet from './sheet'
export * as Sidebar from './sidebar'
export * as Skeleton from './skeleton'
export * as Slider from './slider'
export * as Sonner from './sonner'
export * as Spinner from './spinner'
export * as Switch from './switch'
export * as Table from './table'
export * as TabsPrimitive from './tabs'
export * as Textarea from './textarea'
export * as ToggleGroup from './toggle-group'
export * as Toggle from './toggle'
export * as Tooltip from './tooltip'
export * as Trace from './trace'
