<script setup lang="ts">
import { computed, ref, useId, type Directive } from 'vue'
import { MinusIcon, PlusIcon, UsersIcon } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FlightSearchPassengers } from '@/types'

type PassengerKey = keyof FlightSearchPassengers

interface Props {
  id?: string
  label?: string
  disabled?: boolean
  hasError?: boolean
  errorMessage?: string
  inputClassName?: string
  contentClassName?: string
  maxAdults?: number
  maxChildren?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  label: '',
  disabled: false,
  hasError: false,
  errorMessage: '',
  inputClassName: '',
  contentClassName: '',
  maxAdults: 9,
  maxChildren: 8,
})

const model = defineModel<FlightSearchPassengers>({
  default: () => ({ adults: 1, children: 0, infants: 0 }),
})

const generatedId = useId()
const triggerId = computed(() => props.id ?? generatedId)
const errorId = computed(() => `${triggerId.value}-error`)

const isOpen = ref(false)
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

const passengerTypes = computed(() => [
  {
    key: 'adults' as PassengerKey,
    label: 'Adults',
    hint: '12+ years',
    min: 1,
    max: props.maxAdults,
  },
  {
    key: 'children' as PassengerKey,
    label: 'Children',
    hint: '2–11 years',
    min: 0,
    max: props.maxChildren,
  },
  {
    key: 'infants' as PassengerKey,
    label: 'Infants',
    hint: 'Under 2',
    min: 0,
    max: model.value.adults,
  },
])

function adjust(key: PassengerKey, delta: number) {
  const type = passengerTypes.value.find((t) => t.key === key)
  if (!type) return
  const next = { ...model.value }
  next[key] = Math.min(type.max, Math.max(type.min, next[key] + delta))
  if (next.infants > next.adults) next.infants = next.adults
  model.value = next
}

const summary = computed(() => {
  const { adults, children, infants } = model.value
  const parts = [`${adults} Adult${adults > 1 ? 's' : ''}`]
  if (children) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`)
  if (infants) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`)
  return parts.join(', ')
})

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    closeDropdown()
    triggerRef.value?.focus()
  }
}

const triggerClasses = computed(() =>
  cn(
    'flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border bg-white pr-3.5 pl-4 text-sm font-medium text-slate-800 outline-none transition-[border-color,box-shadow] duration-200',
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

defineExpose({ triggerRef })
</script>

<template>
  <div
    v-click-outside="closeDropdown"
    class="flex w-full flex-col"
    :class="{ 'cursor-not-allowed opacity-50': disabled }"
    @keydown="onTriggerKeydown"
  >
    <Label
      v-if="label || $slots.label"
      :for="triggerId"
      class="mb-1.5!"
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
        aria-haspopup="true"
        :disabled="disabled"
        :aria-expanded="isOpen"
        :aria-invalid="hasError || undefined"
        :aria-describedby="hasError && errorMessage ? errorId : undefined"
        :class="triggerClasses"
        @click="toggleDropdown"
      >
        <span class="truncate">
          <slot name="value-display" :value="model" :summary="summary">
            {{ summary }}
          </slot>
        </span>
        <slot name="rightContent">
          <UsersIcon class="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" />
        </slot>
      </button>

      <div
        v-if="isOpen"
        :class="
          cn(
            'absolute top-full left-0 z-30 mt-1.5 w-full min-w-56 rounded-xl border border-[#e8ecef] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]',
            contentClassName,
          )
        "
      >
        <div
          v-for="type in passengerTypes"
          :key="type.key"
          class="flex items-center justify-between py-2 first:pt-0 last:pb-0"
        >
          <div>
            <p class="text-sm font-medium text-slate-800">{{ type.label }}</p>
            <p class="text-xs text-slate-400">{{ type.hint }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="model[type.key] <= type.min"
              :aria-label="`Decrease ${type.label}`"
              @click="adjust(type.key, -1)"
              class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#e8ecef] text-slate-500 transition-colors duration-200 hover:border-[#1a6b5a] hover:text-[#1a6b5a] disabled:pointer-events-none disabled:opacity-40"
            >
              <MinusIcon class="h-3.5 w-3.5" />
            </button>
            <span class="w-6 text-center text-sm font-semibold text-slate-800">
              {{ model[type.key] }}
            </span>
            <button
              type="button"
              :disabled="model[type.key] >= type.max"
              :aria-label="`Increase ${type.label}`"
              @click="adjust(type.key, 1)"
              class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#e8ecef] text-slate-500 transition-colors duration-200 hover:border-[#1a6b5a] hover:text-[#1a6b5a] disabled:pointer-events-none disabled:opacity-40"
            >
              <PlusIcon class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <slot name="error">
      <p v-if="hasError && errorMessage" :id="errorId" class="mt-1.5 text-sm text-red-600">
        {{ errorMessage }}
      </p>
    </slot>
  </div>
</template>
