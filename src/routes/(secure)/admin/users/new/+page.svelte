<script lang="ts">
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1>Create User</h1>
		<a href={resolve("/admin/users")} class="btn btn-secondary">Back to Users</a>
	</div>

	{#if form?.message}
		<div class="alert alert-danger">{form.message}</div>
	{/if}

	<form method="POST" action="?/create">
		<div class="mb-3">
			<label for="username" class="form-label">Email</label>
			<input
				type="email"
				id="username"
				name="username"
				class="form-control"
				value={form?.username ?? ""}
				autocomplete="email"
				maxlength="254"
				required
			/>
		</div>

		<div class="mb-3">
			<label for="role" class="form-label">Role</label>
			<select id="role" name="role" class="form-select">
				{#each data.roles as role (role)}
					<option value={role} selected={role === "user"}>
						{role.charAt(0).toUpperCase() + role.slice(1)}
					</option>
				{/each}
			</select>
		</div>

		<p class="text-muted">Users sign in with a magic link sent to their email address.</p>

		<button type="submit" class="btn btn-success">Create User</button>
	</form>
</div>
