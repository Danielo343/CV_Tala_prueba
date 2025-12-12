<template>
  <nav class="pagination-bar">
    <button :disabled="page === 1 || loading" @click="$emit('change', 1)">
      « Primera
    </button>
    <button :disabled="page === 1 || loading" @click="$emit('change', page - 1)">
      ‹
    </button>
    <span v-if="startPage > 1">...</span>
    <button
      v-for="p in visiblePages"
      :key="p"
      :class="{ active: p === page }"
      @click="$emit('change', p)"
      :disabled="loading"
    >
      {{ p }}
    </button>
    <span v-if="endPage < totalPages">...</span>
    <button :disabled="page === totalPages || loading" @click="$emit('change', page + 1)">
      ›
    </button>
    <button :disabled="page === totalPages || loading" @click="$emit('change', totalPages)">
      Última »
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  maxVisible: { type: Number, default: 5 }
});

const startPage = computed(() => {
  if (props.totalPages <= props.maxVisible) return 1;
  let start = props.page - Math.floor(props.maxVisible / 2);
  if (start < 1) start = 1;
  if (start + props.maxVisible - 1 > props.totalPages) start = props.totalPages - props.maxVisible + 1;
  return start;
});

const endPage = computed(() => {
  return Math.min(props.totalPages, startPage.value + props.maxVisible - 1);
});

const visiblePages = computed(() => {
  const pages = [];
  for (let i = startPage.value; i <= endPage.value; i++) {
    pages.push(i);
  }
  return pages;
});
</script>

<style scoped>
.pagination-bar {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
}
.pagination-bar button {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.3rem 0.7rem;
  font-size: 1rem;
  cursor: pointer;
  min-width: 2.2rem;
  transition: background 0.2s, color 0.2s;
}
.pagination-bar button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
.pagination-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-bar span {
  padding: 0 0.5rem;
  color: #888;
  font-size: 1.1rem;
}
</style>
