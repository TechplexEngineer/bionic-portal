<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
</script>

<div class="container" style="max-width: 500px;">
	<h1>Register</h1>

	<form class="register-form" use:enhance action="?/register" method="post">
		<div class="mb-3">
			<label for="firstName" class="form-label">First Name</label>
			<input id="firstName" name="firstname" type="text" class="form-control" required />
		</div>

		<div class="mb-3">
			<label for="lastName" class="form-label">Last Name</label>
			<input id="lastName" name="lastname" type="text" class="form-control" required />
		</div>

		<div class="mb-3">
			<label for="email" class="form-label">School Email</label>
			<input
				id="email"
				name="email"
				type="email"
				class="form-control"
				required
				pattern=".+@.+\..+"
			/>
		</div>

		{#if form?.error}
			<div class="alert alert-danger mb-3">{form.error}</div>
		{/if}
		<div class="d-flex gap-2">
			<a href="/attend" class="btn btn-secondary">Cancel</a>
			<button type="submit" class="btn btn-primary">Register</button>
		</div>
	</form>
</div>
