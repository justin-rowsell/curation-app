import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import PocketBase from 'pocketbase';
import { base } from '$app/paths'

import { derived, writable } from 'svelte/store';
import type { Museum } from './museum';
import { setMuseum } from '$lib/stores/museum';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

export const currentUser = writable(pb.authStore);

export const avatar = derived(currentUser, ($currentUser) => {
    // if ($currentUser) {
    //     const url = pb.getFileUrl($currentUser, $currentUser.avatar);
    //     if (url !== "https://climate-oracle.fly.dev/api/files/_pb_users_auth_/soi6ja4leq08o99/avatar1_VRd4yXxUaX.png") {
    //         return url;
    //     }
    // }
    // default to a placeholder avatar
    return `${base}/avatar3.png`;
});

pb.authStore.onChange(async (auth) => {
    currentUser.set(pb.authStore);
    const museum = await getUserMuseum(pb.authStore.model?.id);
    if (museum) {
        setMuseum(museum);
    }
});

export async function pbLogin(email: string, password: string) {
    await pb.collection('users').authWithPassword(email, password);
    const museum = await getUserMuseum(pb.authStore.model?.id);
    if (museum) {
        setMuseum(museum);
    }
    return pb.authStore;
}

export async function deleteUser(userId: string) {
    // delete in app database
    await pb.collection('users').delete(userId);
}

export async function pbSignUp(username: string, name: string, email: string, password: string) {
    // create the dbNamespace from the email by stripping out the @ and .
    const dbNamespace = email.replace(/[@.]/g, '');
    try {
        const newData = {
            username,
            name,
            email,
            password,
            passwordConfirm: password,
            dbNamespace,
            isAdmin: false
        };
        const record = await pb.collection('users').create(newData);
        await pbLogin(email, password);
        // use aquaberry API to create user in the core crm
        try {
           
        return {
            id: record.id
        };
        } catch (err) {
            // we need to delete the new user from the db if the remote call fails
            await pb.collection('users').delete(record.id);
            console.error(err);
            throw err;
        }
    } catch (err) {
        console.error(err)
        throw err;
    }
}

export function pbSignOut() {
    pb.authStore.clear();
}

export function getFileUrl(fileId: string) {
    return `${PUBLIC_POCKETBASE_URL}/files/${fileId}`;
}

export async function getUserMuseum(userId: string | undefined): Promise<Museum | null> {
    if (!userId) {
        return null;
    }
    try {
        const records = await pb.collection('museums').getList(1, 1, {
            filter: `users ~ "${userId}"`,
        });
        
        if (records.items.length > 0) {
            console.log(records.items[0]);
            return records.items[0] as unknown as Museum;
        }
        return null;
    } catch (error) {
        console.error('Error fetching museum records:', error);
        throw error;
    }
}