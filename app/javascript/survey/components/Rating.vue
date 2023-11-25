<template>
    <div class="customer-satisfcation mb-2">
        <div class="ratings flex py-5 px-0">
            <div v-for="rating in ratings">
                <input type="radio"
                       :class="buttonClass(rating)"
                       :value="rating.value"
                       :name="radioName"
                       @click="onClick(rating)"
                >
                <label class="text-base font-medium text-black-800 mt-4 mb-4">
                    {{rating.value}}
                </label>
            </div>
        </div>
    </div>
</template>

<script>
import { CSAT_RATINGS } from 'shared/constants/messages';

export default {
  props: {
    selectedRating: {
      type: Number,
      default: null,
    },
    radioName: {
        type: String,
        default: null,
    },
  },
  data() {
    return {
      ratings: CSAT_RATINGS,
      ratingValue: null
    };
  },

  methods: {
    buttonClass(rating) {
      return [
          { checked: rating.value === this.selectedRating },
          { disabled: !!this.selectedRating },
          { hover: !!this.selectedRating }
      ];
    },
    onClick(rating) {
      this.$emit('selectRating', rating.value);
    },
  },
};
</script>

<style lang="scss" scoped>
input[type=radio] {
  margin: 0 10px 10px 10px;
}

label {
  display: block;
  margin: 0 12px 0 12px;
}

.emoji-button {
  filter: grayscale(100%);
  &.selected,
  &:hover,
  &:focus,
  &:active {
    filter: grayscale(0%);
    transform: scale(1.32);
    transition: transform 300ms;
  }

  &.disabled {
    cursor: default;
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
