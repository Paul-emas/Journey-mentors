<script setup lang="ts" generic="T extends object, V extends string = string">
import { computed, nextTick, ref, useId, watch, type Directive } from 'vue'
import { CheckIcon, ChevronDownIcon } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type StringKey = Extract<keyof T, string>

interface Props {
  items: T[]
  itemLabel: StringKey
  itemValue: StringKey
  id?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  errorMessage?: string
  inputClassName?: string
  contentClassName?: string
  contentItemClassName?: string
  groupBy?: StringKey
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  label: '',
  placeholder: 'Select an option',
  disabled: false,
  hasError: false,
  errorMessage: '',
  inputClassName: '',
  contentClassName: '',
  contentItemClassName: '',
  groupBy: undefined,
})

const model = defineModel<V>()

const generatedId = useId()
const triggerId = computed(() => props.id ?? generatedId)
const listboxId = computed(() => `${triggerId.value}-listbox`)
const errorId = computed(() => `${triggerId.value}-error`)

const isOpen = ref(false)
const highlightedIndex = ref(-1)
const triggerRef = ref<HTMLButtonElement>()

let onDocumentPointerDown: ((event: PointerEvent) => void) | null = null

const vClickOutside: Directive<HTMLElement, () => void> = {
  mounted(el, binding) {
    onDocumentPointerDown = (event) => {
      if (!el.contains(event.target as Node)) binding.value()
    }
    document.addEventListener('pointerdown', onDocumentPointerDown)
  },
  unmounted() {
    if (onDocumentPointerDown) document.removeEventListener('pointerdown', onDocumentPointerDown)
    onDocumentPointerDown = null
  },
}

function getLabel(item: T): string {
  return String(item[props.itemLabel])
}

function getValue(item: T): V {
  return String(item[props.itemValue]) as V
}

function isSelected(item: T): boolean {
  return model.value != null && getValue(item) === model.value
}

const groupedItems = computed(() => {
  const groupKey = props.groupBy
  if (!groupKey) return null

  const groups: Record<string, T[]> = {}
  for (const item of props.items) {
    const key = String(item[groupKey] ?? 'Other')
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
})

interface OptionEntry {
  item: T
  index: number
}

const groupedEntries = computed<Record<string, OptionEntry[]> | null>(() => {
  const groups = groupedItems.value
  if (!groups) return null

  let index = 0
  const entries: Record<string, OptionEntry[]> = {}
  for (const [name, items] of Object.entries(groups)) {
    entries[name] = items.map((item) => ({ item, index: index++ }))
  }
  return entries
})

const orderedItems = computed(() => {
  const groups = groupedItems.value
  return groups ? Object.values(groups).flat() : props.items
})

const selectedItem = computed(() => props.items.find((item) => isSelected(item)))

function optionId(index: number): string {
  return `${triggerId.value}-option-${index}`
}

function setHighlight(index: number) {
  const count = orderedItems.value.length
  if (!count) return
  highlightedIndex.value = ((index % count) + count) % count
  nextTick(() => {
    document.getElementById(optionId(highlightedIndex.value))?.scrollIntoView({ block: 'nearest' })
  })
}

function openDropdown() {
  if (props.disabled || isOpen.value) return
  isOpen.value = true
  const selectedIndex = orderedItems.value.findIndex((item) => isSelected(item))
  setHighlight(selectedIndex >= 0 ? selectedIndex : 0)
}

function closeDropdown() {
  isOpen.value = false
  highlightedIndex.value = -1
}

function toggleDropdown() {
  if (isOpen.value) closeDropdown()
  else openDropdown()
}

function selectItem(item: T) {
  model.value = getValue(item)
  closeDropdown()
  triggerRef.value?.focus()
}

let typeaheadBuffer = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined

function handleTypeahead(char: string) {
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadBuffer += char.toLowerCase()
  typeaheadTimer = setTimeout(() => (typeaheadBuffer = ''), 500)

  const list = orderedItems.value
  const start = Math.max(highlightedIndex.value, 0)
  const offset = typeaheadBuffer.length > 1 ? 0 : 1
  for (let i = 0; i < list.length; i++) {
    const index = (start + offset + i) % list.length
    const candidate = list[index]
    if (candidate && getLabel(candidate).toLowerCase().startsWith(typeaheadBuffer)) {
      setHighlight(index)
      return
    }
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  const isPrintable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey

  if (!isOpen.value) {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      openDropdown()
    } else if (isPrintable) {
      event.preventDefault()
      openDropdown()
      handleTypeahead(event.key)
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      setHighlight(highlightedIndex.value + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      setHighlight(highlightedIndex.value - 1)
      break
    case 'Home':
      event.preventDefault()
      setHighlight(0)
      break
    case 'End':
      event.preventDefault()
      setHighlight(orderedItems.value.length - 1)
      break
    case 'Enter':
    case ' ': {
      if (event.key === ' ' && typeaheadBuffer) {
        event.preventDefault()
        handleTypeahead(event.key)
        break
      }
      event.preventDefault()
      const item = orderedItems.value[highlightedIndex.value]
      if (item) selectItem(item)
      break
    }
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
    case 'Tab':
      closeDropdown()
      break
    default:
      if (isPrintable) {
        event.preventDefault()
        handleTypeahead(event.key)
      }
  }
}

watch(
  () => props.items,
  () => {
    if (isOpen.value)
      setHighlight(Math.max(0, Math.min(highlightedIndex.value, orderedItems.value.length - 1)))
  },
)

const triggerClasses = computed(() =>
  cn(
    'flex h-12 w-full cursor-pointer items-center gap-2 rounded-[10px] border bg-white pr-3.5 pl-4 text-left text-sm font-medium outline-none transition-[border-color,box-shadow] duration-200',
    props.hasError
      ? isOpen.value
        ? 'border-red-500 ring-2 ring-red-500/15'
        : 'border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/15'
      : isOpen.value
        ? 'border-[#1a6b5a] ring-2 ring-[#1a6b5a]/12'
        : 'border-[#e8ecef] hover:border-[#c0c9d2] focus-visible:border-[#1a6b5a] focus-visible:ring-2 focus-visible:ring-[#1a6b5a]/12',
    props.disabled && 'pointer-events-none bg-slate-50',
    props.inputClassName,
  ),
)

function optionClasses(index: number) {
  return cn(
    'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-medium text-slate-800 transition-colors duration-150',
    index === highlightedIndex.value && 'bg-[#e6f5f1] text-[#1a6b5a]',
    props.contentItemClassName,
  )
}

defineExpose({ triggerRef })
</script>

<template>
  <div
    v-click-outside="closeDropdown"
    class="w-full"
    :class="{ 'cursor-not-allowed opacity-50': disabled }"
  >
    <Label
      v-if="label || $slots.label"
      :for="triggerId"
      class="mb-1.5! block"
      :class="{ 'text-red-600': hasError }"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </Label>

    <div class="relative">
      <button
        :id="triggerId"
        ref="triggerRef"
        type="button"
        role="combobox"
        :disabled="disabled"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        :aria-activedescendant="
          isOpen && highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined
        "
        :aria-invalid="hasError || undefined"
        :aria-describedby="hasError && errorMessage ? errorId : undefined"
        :class="triggerClasses"
        @click="toggleDropdown"
        @keydown="onTriggerKeydown"
      >
        <slot name="leftContent" />
        <span class="flex-1 truncate" :class="selectedItem ? 'text-slate-800' : 'text-slate-400'">
          <slot name="value-display" :selected="selectedItem" :value="model">
            {{ selectedItem ? getLabel(selectedItem) : placeholder }}
          </slot>
        </span>
        <slot name="rightContent">
          <ChevronDownIcon
            class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
            aria-hidden="true"
          />
        </slot>
      </button>

      <div
        v-if="isOpen"
        :id="listboxId"
        role="listbox"
        :class="
          cn(
            'absolute top-full left-0 z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-[#e8ecef] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]',
            contentClassName,
          )
        "
      >
        <div v-if="!items.length" class="px-2.5 py-3 text-sm text-slate-400">
          <slot name="empty">No options</slot>
        </div>

        <template v-else-if="groupedEntries">
          <div v-for="(entries, groupName) in groupedEntries" :key="groupName">
            <div
              class="px-2.5 pt-2 pb-1 text-[0.65rem] font-semibold tracking-wider text-slate-400 uppercase"
            >
              {{ groupName }}
            </div>
            <div
              v-for="{ item, index } in entries"
              :id="optionId(index)"
              :key="getValue(item)"
              role="option"
              :aria-selected="isSelected(item)"
              :class="optionClasses(index)"
              @pointerdown.prevent
              @pointerenter="highlightedIndex = index"
              @click="selectItem(item)"
            >
              <span class="flex-1 truncate">
                <slot name="label-display" :item="item">
                  {{ getLabel(item) }}
                </slot>
              </span>
              <CheckIcon
                v-if="isSelected(item)"
                class="h-4 w-4 shrink-0 text-[#1a6b5a]"
                aria-hidden="true"
              />
            </div>
          </div>
        </template>

        <template v-else>
          <div
            v-for="(item, index) in items"
            :id="optionId(index)"
            :key="getValue(item)"
            role="option"
            :aria-selected="isSelected(item)"
            :class="optionClasses(index)"
            @pointerdown.prevent
            @pointerenter="highlightedIndex = index"
            @click="selectItem(item)"
          >
            <span class="flex-1 truncate">
              <slot name="label-display" :item="item">
                {{ getLabel(item) }}
              </slot>
            </span>
            <CheckIcon
              v-if="isSelected(item)"
              class="h-4 w-4 shrink-0 text-[#1a6b5a]"
              aria-hidden="true"
            />
          </div>
        </template>
      </div>
    </div>

    <slot name="error">
      <p v-if="hasError && errorMessage" :id="errorId" class="mt-1.5 text-sm text-red-600">
        {{ errorMessage }}
      </p>
    </slot>
  </div>
</template>
