import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	base: '/dv-Sverdle/',
	ssr: {
		noExternal: ['three', 'troika-three-text']
	},
	optimizeDeps: {
		exclude: ['@threlte/core', '@threlte/extras', 'three']
	}
});
