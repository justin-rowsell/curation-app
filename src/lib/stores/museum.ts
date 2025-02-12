import { writable } from 'svelte/store';
import type { Museum } from '$lib/db/museum';
import { pb } from '$lib/db/pocketbase';
import { getUserMuseum } from '$lib/db/pocketbase';


export let museumStore : Museum | null = null;

export function setMuseum(museum: Museum) {
    museumStore = museum;
}

export async function getMuseum() {
    if (!museumStore) {
        museumStore = await getUserMuseum(pb.authStore.model?.id);
    }
    return museumStore;
}