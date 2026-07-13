<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div
      class="grid w-full items-center gap-3 px-4 py-4"
      style="grid-template-columns: 48px minmax(160px,1.4fr) 72px 1fr 72px minmax(150px,auto) 64px"
    >
      <div class="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />

      <div class="space-y-2">
        <div class="h-3.5 w-32 animate-pulse rounded-full bg-slate-100" />
        <div class="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div class="space-y-2">
        <div class="h-6 w-14 animate-pulse rounded-md bg-slate-100" />
        <div class="h-3 w-8 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div class="flex flex-col gap-2 px-1">
        <div class="h-2 w-full animate-pulse rounded-full bg-slate-100" />
        <div class="flex justify-between">
          <div class="h-3 w-10 animate-pulse rounded-full bg-slate-100" />
          <div class="h-3 w-10 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      <div class="space-y-2">
        <div class="h-6 w-14 animate-pulse rounded-md bg-slate-100" />
        <div class="h-3 w-8 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div class="flex flex-col items-end gap-2">
        <div class="h-5 w-28 animate-pulse rounded-md bg-slate-100" />
        <div class="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div class="ml-auto h-9 w-9 animate-pulse rounded-full bg-slate-100" />
    </div>
  </div>
</template>
