<script setup lang="ts">
// A tick on the Four Clocks slide's axis for each payment, and their total. The slide
// sets --first-year and --px-a-year on a parent, as for ClockBar.vue.
import { paymentsOf, totalOf, yearOf } from "../watch/payments.ts";

const props = defineProps<{ payments: unknown }>();

const payments = paymentsOf(props.payments);
const years = payments.map((paid) => yearOf(paid.date));
const total = totalOf(payments);
</script>

<template>
  <div class="payment-ticks">
    <span
      v-for="year in years"
      :key="year"
      class="payment-tick"
      :style="{ '--year': year }"
    ></span>
    <div class="payment-total">
      {{ total }} in {{ payments.length }} payments, the last at age 80
    </div>
  </div>
</template>

<style scoped>
.payment-tick {
  position: absolute;
  top: 0;
  left: calc((var(--year) - var(--first-year)) * var(--px-a-year));
  width: 2px;
  height: 14px;
  background: var(--palette-ink);
}
.payment-total {
  position: absolute;
  top: 44px;
  right: 0;
  font-size: 28px;
  line-height: 1.2;
  white-space: nowrap;
}
</style>
