<script setup lang="ts">
import { computed, ref, useId, watch, type Directive } from 'vue'
import dayjs from 'dayjs'
import { Label } from '@/components/ui/label'
import { XIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  label?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  minDate?: string
  maxDate?: string
  hasError?: boolean
  errorMessage?: string
  displayFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  id: undefined,
  placeholder: 'Select date',
  disabled: false,
  minDate: undefined,
  maxDate: undefined,
  hasError: false,
  errorMessage: '',
  displayFormat: 'DD MMM YYYY',
})

const model = defineModel<string>({ default: '' })

const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)

const isOpen = ref(false)

const viewMonth = ref(dayjs().month())
const viewYear = ref(dayjs().year())

watch(
  () => model.value,
  (val) => {
    if (val) {
      const d = dayjs(val)
      viewMonth.value = d.month()
      viewYear.value = d.year()
    }
  },
  { immediate: true },
)

const displayValue = computed(() => {
  if (!model.value) return ''
  return dayjs(model.value).format(props.displayFormat)
})

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

function toggleCalendar() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeCalendar() {
  isOpen.value = false
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

const canGoPrev = computed(() => {
  const firstOfPrevMonth = dayjs()
    .year(viewYear.value)
    .month(viewMonth.value)
    .subtract(1, 'month')
    .endOf('month')
  const min = props.minDate ? dayjs(props.minDate) : null
  if (min && firstOfPrevMonth.isBefore(min, 'day')) return false
  return true
})

const monthYearLabel = computed(() => {
  return dayjs().year(viewYear.value).month(viewMonth.value).format('MMMM YYYY')
})

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isDisabled: boolean
  isToday: boolean
  isSelected: boolean
}

const calendarDays = computed((): CalendarDay[] => {
  const firstOfMonth = dayjs().year(viewYear.value).month(viewMonth.value).date(1)
  const startOfWeek = firstOfMonth.day()
  const daysInMonth = firstOfMonth.daysInMonth()

  const todayStr = dayjs().format('YYYY-MM-DD')
  const min = props.minDate ? dayjs(props.minDate).startOf('day') : null
  const max = props.maxDate ? dayjs(props.maxDate).startOf('day') : null

  const days: CalendarDay[] = []

  const prevMonth = firstOfMonth.subtract(1, 'month')
  const prevMonthDays = prevMonth.daysInMonth()
  for (let i = startOfWeek - 1; i >= 0; i--) {
    const d = prevMonth.date(prevMonthDays - i)
    const dateStr = d.format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      day: d.date(),
      isCurrentMonth: false,
      isDisabled: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === model.value,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = firstOfMonth.date(day)
    const dateStr = d.format('YYYY-MM-DD')
    let isDisabled = false
    if (min && d.isBefore(min, 'day')) isDisabled = true
    if (max && d.isAfter(max, 'day')) isDisabled = true

    days.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isDisabled,
      isToday: dateStr === todayStr,
      isSelected: dateStr === model.value,
    })
  }

  const remaining = 42 - days.length
  const nextMonthStart = firstOfMonth.add(1, 'month')
  for (let i = 0; i < remaining; i++) {
    const d = nextMonthStart.date(i + 1)
    const dateStr = d.format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      day: d.date(),
      isCurrentMonth: false,
      isDisabled: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === model.value,
    })
  }

  return days
})

function selectDate(day: CalendarDay) {
  if (day.isDisabled) return
  model.value = day.date
  isOpen.value = false
}

function clearDate(event: Event) {
  event.stopPropagation()
  model.value = ''
}
</script>

<template>
  <div
    v-click-outside="closeCalendar"
    class="relative w-full"
    :class="{ 'pointer-events-none opacity-50': disabled }"
  >
    <Label v-if="label" :for="inputId" class="mb-1.5 block" :class="{ 'text-red-500': hasError }">
      <slot name="label">
        {{ label }}
      </slot>
    </Label>

    <div
      class="flex h-12 cursor-pointer items-center gap-2 rounded-[10px] border bg-white px-3.5 transition-[border-color,box-shadow] duration-200"
      :class="[
        isOpen ? 'ring-[3px] ring-[#1a6b5a]/12' : '',
        hasError
          ? 'border-red-500'
          : isOpen
            ? 'border-[#1a6b5a]'
            : 'border-[#e8ecef] hover:border-[#c0c9d2]',
      ]"
      @click="toggleCalendar"
    >
      <input
        :id="inputId"
        type="text"
        readonly
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="h-full min-w-0 flex-1 cursor-pointer bg-transparent text-[0.9rem] font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
        :aria-invalid="hasError"
        :aria-describedby="hasError && errorMessage ? `${inputId}-error` : undefined"
      />
      <button
        v-if="model"
        type="button"
        class="flex size-5.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-150 hover:bg-slate-200 hover:text-slate-800"
        aria-label="Clear date"
        @click="clearDate"
      >
        <XIcon :size="14" />
      </button>
      <CalendarIcon class="shrink-0 text-slate-400" :size="16" />
    </div>

    <Transition
      enter-active-class="transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="-translate-y-1.5 scale-[0.97] opacity-0"
      leave-to-class="-translate-y-1.5 scale-[0.97] opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute top-full left-0 z-50 mt-1.5 w-70 rounded-[14px] border border-[#e8ecef] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] select-none"
      >
        <div class="mb-3.5 flex items-center justify-between">
          <button
            type="button"
            class="flex size-7.5 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-all duration-150 enabled:hover:bg-slate-100 enabled:hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="!canGoPrev"
            @click="prevMonth"
            aria-label="Previous month"
          >
            <ChevronLeftIcon :size="16" :stroke-width="2.5" />
          </button>
          <span class="text-[0.9rem] font-semibold tracking-[-0.01em] text-slate-800">{{
            monthYearLabel
          }}</span>
          <button
            type="button"
            class="flex size-7.5 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-all duration-150 enabled:hover:bg-slate-100 enabled:hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            @click="nextMonth"
            aria-label="Next month"
          >
            <ChevronRightIcon :size="16" :stroke-width="2.5" />
          </button>
        </div>

        <div class="mb-1 grid grid-cols-7">
          <span
            v-for="wd in weekDays"
            :key="wd"
            class="py-1 text-center text-[0.7rem] font-semibold tracking-wider text-slate-400 uppercase"
            >{{ wd }}</span
          >
        </div>

        <div class="grid grid-cols-7 gap-0.5">
          <button
            v-for="(day, idx) in calendarDays"
            :key="idx"
            type="button"
            :class="
              cn(
                'relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg text-[0.82rem] font-medium text-slate-800 transition-all duration-150',
                !day.isSelected && 'enabled:hover:bg-[#f0fdf8] enabled:hover:text-[#1a6b5a]',
                !day.isCurrentMonth && 'text-slate-300',
                day.isDisabled && 'cursor-not-allowed text-gray-300 opacity-40',
                day.isToday &&
                  !day.isSelected &&
                  'bg-[#f0fdf8] font-semibold text-[#1a6b5a] after:absolute after:bottom-0.75 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#1a6b5a]',
                day.isSelected &&
                  'bg-[#1a6b5a] font-semibold text-white shadow-[0_2px_8px_rgba(26,107,90,0.3)]',
              )
            "
            :disabled="day.isDisabled"
            @click="selectDate(day)"
          >
            {{ day.day }}
          </button>
        </div>

        <div class="mt-2.5 flex justify-center border-t border-slate-100 pt-2.5">
          <button
            type="button"
            class="cursor-pointer rounded-md px-3 py-1 text-[0.78rem] font-semibold text-[#1a6b5a] transition-all duration-150 hover:bg-[#f0fdf8]"
            @click="
              selectDate({
                date: dayjs().format('YYYY-MM-DD'),
                day: dayjs().date(),
                isCurrentMonth: true,
                isDisabled: false,
                isToday: true,
                isSelected: false,
              })
            "
          >
            Today
          </button>
        </div>
      </div>
    </Transition>

    <slot name="error">
      <p
        v-if="hasError && errorMessage"
        :id="`${inputId}-error`"
        class="mt-1.5 text-[0.85rem] text-red-500"
      >
        {{ errorMessage }}
      </p>
    </slot>
  </div>
</template>
