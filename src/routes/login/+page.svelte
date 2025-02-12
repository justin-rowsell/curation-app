<script lang="ts">
	import { goto } from "$app/navigation";
	import { pbLogin, getUserMuseums } from "$lib/db/pocketbase";
    import { museumStore } from "$lib/stores/museum";
    import Toast from "$lib/util/toast.svelte";
    import type { Museum } from "$lib/db/museum";

    let email: string;
    let password: string;
    let toast: Toast;
    let loading: boolean = false;

    async function login() {
      try {
        loading = true;
        // change email tolower
        const lowerEmail = email.toLowerCase();
        const authData = await pbLogin(lowerEmail, password);
        // Fetch museum data for the logged-in user
        const museumData = await getUserMuseums(authData?.record?.id);
        if (!museumData) {
            throw new Error('No museum associated with this user');
        }
        // Store the museum data
        museumStore.set(museumData as Museum);
        
        toast.callToast('Logged in successfully!', 'success');
        // wait 1 seconds
        await new Promise(r => setTimeout(r, 1000));
        // proceed
        goto('/');
      } catch (error) {
          toast.callToast("Unable to login. Try again or contact justin.rowsell@aquaberry.io", 'error');
          console.error(error);
      } finally {
          loading = false;
      }
    }
</script>

<div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 5rem);">
    <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 800px; padding: 2rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 3rem; font-weight: bold;">CHEP Curation App Login</h1>
        </div>

        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px;">
            <div style="margin-bottom: 1rem;">
                <label for="email" style="display: block; margin-bottom: 0.5rem;">
                    Email
                </label>
                <input 
                    type="text" 
                    placeholder="email" 
                    id="email" 
                    bind:value={email}
                    style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
                />
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label for="password" style="display: block; margin-bottom: 0.5rem;">
                    Password
                </label>
                <input 
                    type="password" 
                    placeholder="password" 
                    id="password" 
                    bind:value={password}
                    style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
                />
            </div>

            <button 
                on:click={login} 
                disabled={loading}
                style="width: 100%; padding: 0.75rem; background-color: #4A90E2; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 0.5rem;"
            >
                Login
                {#if loading}
                    <div style="width: 1rem; height: 1rem; border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
                {/if}
            </button>
        </div>
    </div>
</div>

<style>
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>

<Toast bind:this={toast} />