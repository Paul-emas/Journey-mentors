<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'

const selectedDate = defineModel<string>({ default: '' })

const today = dayjs().format('YYYY-MM-DD')

const DAYS_SHOWN = 10

const stripOffset = ref(0)
const direction = ref(1)

const minOffset = computed(() => {
  const center = dayjs(selectedDate.value || today)
  return dayjs(today).diff(center, 'day') + 3
})

stripOffset.value = Math.max(0, minOffset.value)

const days = computed(() => {
  const center = dayjs(selectedDate.value || today).add(stripOffset.value, 'day')
  const start = center.subtract(3, 'day')
  const result = []
  for (let i = 0; i < DAYS_SHOWN; i++) {
    const d = start.add(i, 'day')
    result.push({
      date: d.format('YYYY-MM-DD'),
      dayLabel: d.format('DD MMM'),
      shortWeekday: d.format('ddd'),
    })
  }
  return result
})

const canGoPrev = computed(() => stripOffset.value > minOffset.value)

function selectDay(date: string) {
  selectedDate.value = date
}

function shiftStrip(dir: number) {
  direction.value = dir
  stripOffset.value = Math.max(minOffset.value, stripOffset.value + dir * 4)
}

watch(selectedDate, (next, prev) => {
  if (next && prev) direction.value = dayjs(next).isBefore(dayjs(prev), 'day') ? -1 : 1
  stripOffset.value = Math.max(0, minOffset.value)
})
</script>

<template>
  <div class="flex items-center gap-2 rounded-xl bg-[#f5f7f9] px-2 py-3">
    <button
      type="button"
      :disabled="!canGoPrev"
      class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e8ecef] bg-white text-slate-500 transition-all duration-200 hover:border-[#1a6b5a] hover:bg-[#e6f5f1] hover:text-[#1a6b5a] disabled:pointer-events-none disabled:opacity-40"
      aria-label="Previous days"
      @click="shiftStrip(-1)"
    >
      <ChevronLeftIcon class="h-4 w-4" :stroke-width="2.5" />
    </button>

    <TransitionGroup
      tag="div"
      :name="direction === 1 ? 'strip-next' : 'strip-prev'"
      class="relative flex flex-1 gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="day in days"
        :key="day.date"
        type="button"
        @click="selectDay(day.date)"
        class="flex h-14 flex-1 cursor-pointer flex-col items-center justify-center rounded-[10px] border-[1.5px] px-2 py-1.5 transition-all duration-200"
        :class="
          selectedDate === day.date
            ? 'border-[#1a6b5a] bg-[#e6f5f1] shadow-[0_4px_12px_rgba(26,107,90,0.15)]'
            : 'border-transparent bg-white hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        "
      >
        <span
          class="text-[0.85rem] leading-tight font-semibold"
          :class="selectedDate === day.date ? 'text-[#1a6b5a]' : 'text-slate-800'"
        >
          {{ day.dayLabel }}
        </span>
        <span
          class="mt-0.5 text-[0.7rem] font-medium capitalize"
          :class="selectedDate === day.date ? 'text-[#1a6b5a]/70' : 'text-slate-400'"
        >
          {{ day.shortWeekday }}
        </span>
      </button>
    </TransitionGroup>

    <button
      type="button"
      class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e8ecef] bg-white text-slate-500 transition-all duration-200 hover:border-[#1a6b5a] hover:bg-[#e6f5f1] hover:text-[#1a6b5a]"
      aria-label="Next days"
      @click="shiftStrip(1)"
    >
      <ChevronRightIcon class="h-4 w-4" :stroke-width="2.5" />
    </button>
  </div>
</template>

<style scoped>
.strip-next-move,
.strip-prev-move,
.strip-next-enter-active,
.strip-prev-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.strip-next-leave-active,
.strip-prev-leave-active {
  transition: opacity 0.15s ease;
  position: absolute;
}

.strip-next-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.strip-prev-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

.strip-next-leave-to,
.strip-prev-leave-to {
  opacity: 0;
}
</style>
