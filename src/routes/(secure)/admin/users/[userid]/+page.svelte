<script lang="ts">
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1>Edit User <small class="text-muted">{data.currentUser.username}</small></h1>
		<a href={resolve("/admin/users")} class="btn btn-secondary">Back to Users</a>
	</div>

	{#if form?.message}
		<div class="alert alert-danger">{form.message}</div>
	{/if}
	{#if form?.success}
		<div class="alert alert-success">User updated successfully.</div>
	{/if}

	<form method="POST" action="?/edit">
		<div class="mb-3">
			<label for="username" class="form-label">Email</label>
			<input
				type="email"
				id="username"
				name="username"
				class="form-control"
				value={data.currentUser.username}
				autocomplete="email"
				maxlength="254"
				required
			/>
		</div>

		<div class="mb-3">
			<label for="role" class="form-label">Role</label>
			<select id="role" name="role" class="form-select">
				{#each data.roles as role (role)}
					<option value={role} selected={data.currentUser.role === role}>
						{role.charAt(0).toUpperCase() + role.slice(1)}
					</option>
				{/each}
			</select>
		</div>

		<p class="text-muted">Users sign in with a magic link sent to their email address.</p>

		<button type="submit" class="btn btn-primary me-2">Save Changes</button>
	</form>

	<hr class="my-4" />

	<form
		method="POST"
		action="?/delete"
		onsubmit={(e) => {
			if (!confirm("Are you sure you want to delete this user? This action cannot be undone."))
				e.preventDefault();
		}}
	>
		<button type="submit" class="btn btn-danger">Delete User</button>
	</form>
</div>
