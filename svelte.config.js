import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/dv-Sverdle' : ''
		}
	},
	prerender: {
		handleHttpError: ({ path, referrer, message }) => {
			// Ignorer toutes les erreurs de base path
			if (message.includes('does not begin with `base`')) {
				return;
			}
			throw new Error(message);
		}
	}
};

export default config;
