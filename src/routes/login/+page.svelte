<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData, PageData } from "./$types";
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let requesting = $state(false);
</script>

<svelte:head><title>Login | Bionic Portal</title></svelte:head>

<main class="container py-5">
	<div class="row justify-content-center">
		<div class="col-12 col-md-7 col-lg-5">
			<div class="card shadow-sm p-4">
				<h1 class="h3 text-center">Bionic Portal</h1>
				<p class="text-center text-body-secondary">Sign in with an email magic link.</p>
				<p class="text-center text-body-secondary">
					Use a <strong>billericak12.com</strong> email address.
				</p>
				{#if form?.message}
					<div class={form.success ? "alert alert-success" : "alert alert-danger"} role="status">
						{form.message}
					</div>
				{/if}
				{#if form?.success}
					<p>
						Check your inbox for <strong>{form.email}</strong>. Your link expires in 15 minutes.
						Check your spam folder if it does not arrive.
					</p>
				{/if}
				<form
					method="post"
					action="?/requestLink"
					use:enhance={() => {
						requesting = true;
						return async ({ update }) => {
							try {
								await update({ reset: false });
							} finally {
								requesting = false;
							}
						};
					}}
				>
					<input type="hidden" name="next" value={data.next} />
					<div class="mb-3">
						<label for="email" class="form-label">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							class="form-control"
							autocomplete="email"
							maxlength="254"
							value={form?.email ?? ""}
							placeholder="@billericak12.com"
							required
						/>
					</div>
					<button class="btn btn-primary w-100" type="submit" disabled={requesting}>
						{requesting
							? "Sending link…"
							: form?.success
								? "Send another sign-in link"
								: "Send sign-in link"}
					</button>
				</form>
			</div>
		</div>
	</div>
</main>
