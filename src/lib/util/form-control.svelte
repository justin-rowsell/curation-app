<script lang="ts">
    export let id: string;
    export let label: string;
</script>
<div class="form-control w-full pt-8">
    <label class="label" for="{id}">
        <span class="label-text">{label}</span>
    </label>
    <slot/>
</div>