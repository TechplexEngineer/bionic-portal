<script module lang="ts">
	export const headerState = $state({
		loginVisible: true
	});
</script>

<script lang="ts">
	import { page } from "$app/stores";
	import { tools } from "$lib/components/routes";
	import md5 from "md5";
	import userIcon from "@fortawesome/fontawesome-free/svgs/solid/user.svg";

	interface Props {
		user: App.Locals["user"] | null;
	}
	let { user }: Props = $props();

	function getGravatarUrl(username: string, size: number = 32) {
		if (!username) return "";
		const hash = md5(username.trim().toLowerCase());
		return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`; //&d=retro
	}
	function getGravatarEditUrl(username: string) {
		if (!username) return "";
		const hash = md5(username.trim().toLowerCase());
		return `https://www.gravatar.com/${hash}`;
	}

	let gravatarUrl = $derived(user ? getGravatarUrl(user.username) : userIcon);
</script>

<nav class="navbar navbar-expand-lg bg-dark border-bottom border-body mb-2" data-bs-theme="dark">
	<div class="container-fluid">
		<a class="navbar-brand" href="/" title="Bionics Team Portal">BionicPortal</a>
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarColor01"
			aria-controls="navbarColor01"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarColor01">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				{#each tools as link (link.name)}
					<li class="nav-item">
						<a
							class="nav-link {$page.url.pathname === link.path ? 'active' : ''}"
							aria-current="page"
							title={link.description}
							href={link.path}>{link.name}</a
						>
					</li>
				{/each}
				{#if !!user}
					<li class="nav-item">
						<a
							class="nav-link {$page.url.pathname === '/dashboard' ? 'active' : ''}"
							aria-current="page"
							href="/dashboard">Dashboard</a
						>
					</li>
					<li class="nav-item">
						<a
							class="nav-link {$page.url.pathname === '/compete' ? 'active' : ''}"
							aria-current="page"
							href="/compete">Events</a
						>
					</li>
					{#if user.role === "admin"}
						<li class="nav-item dropdown">
							<a
								class="nav-link dropdown-toggle {$page.url.pathname.startsWith('/admin')
									? 'active'
									: ''}"
								href="#admin-menu"
								role="button"
								data-bs-toggle="dropdown"
								aria-expanded="false">Admin</a
							>
							<ul class="dropdown-menu" id="admin-menu">
								<li><a class="dropdown-item" href="/admin">Admin Dashboard</a></li>
							</ul>
						</li>
					{/if}
				{/if}
			</ul>
		</div>

		{#if headerState.loginVisible}
			{#if !!user}
				<div class="dropdown text-end">
					<button
						class="d-block btn btn-link link-body-emphasis text-decoration-none dropdown-toggle"
						data-bs-toggle="dropdown"
						aria-expanded="false"
						data-bs-offset="10,20"
					>
						<img
							src={gravatarUrl}
							alt="mdo"
							width="32"
							height="32"
							class="rounded-circle"
							data-bs-offset="10,20"
						/>
					</button>

					<ul class="dropdown-menu dropdown-menu-end text-small">
						<li><span class="dropdown-item-text">{user.username}</span></li>
						<li><hr class="dropdown-divider" /></li>
						<li>
							<a class="dropdown-item" href="https://gravatar.com" target="_blank">Edit Avatar</a>
						</li>
						<li><hr class="dropdown-divider" /></li>
						<li>
							<a class="dropdown-item" href="/logout">Sign out</a>
						</li>
					</ul>
				</div>
			{:else}
				<div class="text-end">
					<a href="/login" class="btn btn-primary me-2">Sign In / Register</a>
				</div>
			{/if}
		{/if}
	</div>
</nav>
