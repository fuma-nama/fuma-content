<script setup lang="ts" generic="Frontmatter, Attached = unknown">
import { defineAsyncComponent, computed, markRaw, ref } from "vue";
import type { Component } from "vue";
import type { CompiledMDX } from "./build-mdx";
import type { MDXStoreBrowserData } from "./runtime-browser";
import { isPromiseLike } from "@/utils/is-promise-like";

defineOptions({
  name: "Renderer",
});

const props = defineProps<{
  entry?: MDXStoreBrowserData<Frontmatter, Attached>;
}>();

const slots = defineSlots<{
  default: (scope: { data: CompiledMDX<Frontmatter> & Attached }) => any;
}>();
let dynamicComponent: Component | null = null;

if (props.entry) {
  const entry = props.entry;
  const forceAsync = ref(false);

  const asyncComponent = defineAsyncComponent(async () => {
    const loaded = await entry.preload();
    return markRaw({
      render: () => slots.default?.({ data: loaded }) ?? null,
    });
  });

  dynamicComponent = computed(() => {
    const v = entry.preload();

    if (!isPromiseLike(v) && !forceAsync.value) {
      return markRaw({
        render: () => slots.default({ data: v }),
      });
    }

    forceAsync.value = true;
    return asyncComponent;
  });
}
</script>

<template>
  <component :is="dynamicComponent" />
</template>
