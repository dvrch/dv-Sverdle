<script>
	import { confetti } from '@neoconfetti/svelte';
	import { Game } from './game';
	import { reduced_motion } from './reduced-motion';
	import { browser } from '$app/environment';

	// État du jeu côté client
	let game = new Game();
	let guesses = game.guesses;
	let answers = game.answers;
	let answer = null;

	// État de l'interface
	let form;
	let classnames = {};
	let description = {};

	/** Whether or not the user has won */
	$: won = answers.at(-1) === 'xxxxx';

	/** The index of the current guess */
	$: i = won ? -1 : answers.length;

	/** Whether the current guess can be submitted */
	$: submittable = guesses[i]?.length === 5;

	// Charger l'état depuis localStorage si disponible
	if (browser) {
		const saved = localStorage.getItem('sverdle');
		if (saved) {
			game = new Game(saved);
			guesses = game.guesses;
			answers = game.answers;
			answer = game.answers.length >= 6 ? game.answer : null;
		}
	}

	// Sauvegarder l'état dans localStorage
	function saveGame() {
		if (browser) {
			localStorage.setItem('sverdle', game.toString());
		}
	}

	// Mettre à jour les classnames et descriptions
	$: {
		classnames = {};
		description = {};

		answers.forEach((answer, i) => {
			const guess = guesses[i];

			for (let i = 0; i < 5; i += 1) {
				const letter = guess[i];

				if (answer[i] === 'x') {
					classnames[letter] = 'exact';
					description[letter] = 'correct';
				} else if (!classnames[letter]) {
					classnames[letter] = answer[i] === 'c' ? 'close' : 'missing';
					description[letter] = answer[i] === 'c' ? 'present' : 'absent';
				}
			}
		});
	}

	// Gérer les touches du clavier
	function handleKeydown(event) {
		if (won) return;

		const { key } = event;

		if (key === 'Backspace') {
			handleKey('backspace');
		} else if (key === 'Enter') {
			handleEnter();
		} else if (key.length === 1 && key >= 'a' && key <= 'z') {
			handleKey(key);
		}
	}

	// Gérer une touche
	function handleKey(key) {
		if (won) return;

		if (key === 'backspace') {
			game.guesses[i] = game.guesses[i].slice(0, -1);
		} else {
			game.guesses[i] += key;
		}

		guesses = game.guesses;
		saveGame();
	}

	// Gérer la soumission d'un mot
	function handleEnter() {
		if (!submittable) return;

		const guess = guesses[i];
		if (game.enter(guess)) {
			answers = game.answers;
			answer = game.answers.length >= 6 ? game.answer : null;
			saveGame();
		}
	}

	// Redémarrer le jeu
	function restart() {
		game = new Game();
		guesses = game.guesses;
		answers = game.answers;
		answer = null;
		if (browser) {
			localStorage.removeItem('sverdle');
		}
	}

	// Ajouter l'écouteur d'événements au montage
	if (browser) {
		window.addEventListener('keydown', handleKeydown);
	}
</script>

<svelte:head>
	<title>Sverdle</title>
</svelte:head>

<form
	bind:this={form}
	on:submit|preventDefault={handleEnter}
	class:won
	class:lost={answer && !won}
>
	<div class="grid">
		{#each guesses as guess, i}
			<div class="word">
				{#each guess.split('') as letter, j}
					<div
						class="letter"
						class:exact={answers[i]?.[j] === 'x'}
						class:close={answers[i]?.[j] === 'c'}
						class:missing={answers[i]?.[j] === '_'}
					>
						{letter}
					</div>
				{/each}
				{#each Array(5 - guess.length) as _}
					<div class="letter"></div>
				{/each}
			</div>
		{/each}
	</div>

	<div class="keyboard">
		{#each ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as row}
			<div class="row">
				{#each row.split('') as letter}
					<button
						type="button"
						class="key"
						class:exact={classnames[letter] === 'exact'}
						class:close={classnames[letter] === 'close'}
						class:missing={classnames[letter] === 'missing'}
						on:click={() => handleKey(letter)}
						aria-label="{letter} {description[letter] || 'not guessed'}"
					>
						{letter}
					</button>
				{/each}
			</div>
		{/each}
		<div class="row">
			<button type="button" class="key wide" on:click={handleEnter} disabled={!submittable}>
				Enter
			</button>
			<button type="button" class="key wide" on:click={() => handleKey('backspace')}>
				Backspace
			</button>
		</div>
	</div>

	{#if won}
		<div class="message">
			<h2>Félicitations !</h2>
			<p>Vous avez trouvé le mot : <strong>{answer}</strong></p>
			<button type="button" on:click={restart}>Nouveau jeu</button>
		</div>
	{:else if answer}
		<div class="message">
			<h2>Dommage !</h2>
			<p>Le mot était : <strong>{answer}</strong></p>
			<button type="button" on:click={restart}>Nouveau jeu</button>
		</div>
	{/if}
</form>

{#if won}
	<div
		style="position: absolute; left: 50%; top: 30%"
		use:confetti={{
			particleCount: $reduced_motion ? 0 : undefined,
			force: 0.7,
			stageWidth: window.innerWidth,
			stageHeight: window.innerHeight,
			colors: ['#ff3e00', '#40b3ff', '#676778']
		}}
	></div>
{/if}

<style>
	form {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		box-sizing: border-box;
	}

	.grid {
		display: grid;
		grid-template-rows: repeat(6, 1fr);
		gap: 0.5rem;
		width: 100%;
		max-width: 20rem;
		aspect-ratio: 5/6;
	}

	.word {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.25rem;
	}

	.letter {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
		text-transform: uppercase;
		border: 2px solid #d3d6da;
		background: white;
		color: black;
		aspect-ratio: 1;
		transition: all 0.2s ease-in-out;
	}

	.letter.exact {
		background: #6aaa64;
		border-color: #6aaa64;
		color: white;
	}

	.letter.close {
		background: #c9b458;
		border-color: #c9b458;
		color: white;
	}

	.letter.missing {
		background: #787c7e;
		border-color: #787c7e;
		color: white;
	}

	.keyboard {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 30rem;
	}

	.row {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
	}

	.key {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: bold;
		text-transform: uppercase;
		border: none;
		background: #d3d6da;
		color: black;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		min-width: 2rem;
		height: 3rem;
		padding: 0 0.5rem;
	}

	.key:hover {
		background: #b3b6ba;
	}

	.key:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.key.wide {
		min-width: 4rem;
	}

	.key.exact {
		background: #6aaa64;
		color: white;
	}

	.key.close {
		background: #c9b458;
		color: white;
	}

	.key.missing {
		background: #787c7e;
		color: white;
	}

	.message {
		text-align: center;
		padding: 1rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-top: 1rem;
	}

	.message h2 {
		margin: 0 0 0.5rem 0;
		color: #6aaa64;
	}

	.message p {
		margin: 0 0 1rem 0;
	}

	.message button {
		background: #6aaa64;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: bold;
		transition: background 0.2s ease-in-out;
	}

	.message button:hover {
		background: #5a9a54;
	}

	form.won .grid {
		animation: celebrate 0.6s ease-in-out;
	}

	form.lost .grid {
		animation: shake 0.6s ease-in-out;
	}

	@keyframes celebrate {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}

	@media (max-width: 480px) {
		.letter {
			font-size: 1.25rem;
		}

		.key {
			font-size: 0.75rem;
			min-width: 1.5rem;
			height: 2.5rem;
		}

		.key.wide {
			min-width: 3rem;
		}
	}
</style>