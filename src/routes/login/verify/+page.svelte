<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { ActionData, PageData } from "./$types";
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let signingIn = $state(false);
</script>

<svelte:head>
	<title>Sign in | Bionic Portal</title>
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<main class="container py-5">
	<div class="row justify-content-center">
		<div class="col-12 col-md-7 col-lg-5">
			<div class="card shadow-sm p-4">
				<h1 class="h3">Sign in to Bionic Portal</h1>
				{#if form?.message}
					<div class="alert alert-danger" role="alert">{form.message}</div>
				{/if}
				{#if data.token && !form?.message}
					<p>Select Sign in to use your email link.</p>
					<form
						method="post"
						use:enhance={() => {
							signingIn = true;
							return async ({ update }) => {
								try {
									await update();
								} finally {
									signingIn = false;
								}
							};
						}}
					>
						<input type="hidden" name="token" value={data.token} />
						<button type="submit" class="btn btn-primary w-100" disabled={signingIn}
							>{signingIn ? "Signing in…" : "Sign in"}</button
						>
					</form>
				{:else if !form?.message}
					<div class="alert alert-danger" role="alert">
						This sign-in link is invalid. Please request a new one.
					</div>
				{/if}
				<a class="mt-3" href={resolve("/login")}>Request a new sign-in link</a>
			</div>
		</div>
	</div>
</main>
