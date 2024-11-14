/// <reference types="svelte-adapter-azure-swa" />
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			clientPrincipal: import('$lib/auth').ClientPrincipal | null;
		}
	}
}

export {};