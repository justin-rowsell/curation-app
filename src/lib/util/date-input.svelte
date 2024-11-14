<script lang="ts">
    import dayjs from 'dayjs'
  
    export let format = 'YYYY-MM-DDTHH:00';
    export let date = new Date();
    export let id: string;
    export let disableTimeRange: boolean;

    let step = 3600;
      
    let internal: string;

    const input = (x: Date) => {
      internal = dayjs(x).format(format);
    }
    const output = (x: string) => {
      const newDate = dayjs(x, format).toDate();
      date = newDate;
    }
  
    $: input(date)
    $: output(internal)
  </script>
  
  <input type="datetime-local"
    class="input input-bordered input-secondary" 
    class:disabled={disableTimeRange}
    disabled={disableTimeRange}
    id={id} name={id}
    {step}
    bind:value={internal} />
  
<style>

</style>
  