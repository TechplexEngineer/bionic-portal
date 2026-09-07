<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let registering = $state<string | null>(null);
</script>

<svelte:head>
	<title>Register to Compete | N.E.R.D.</title>
</svelte:head>

<div class="compete-container">
	<header class="page-header">
		<h1>Register to Compete</h1>
		<p class="subtitle">Join our upcoming events and show your skills!</p>
	</header>

	{#if form?.message}
		<div class="alert alert-danger" role="alert">{form.message}</div>
	{/if}

	{#if data.events.length === 0}
		<div class="empty-state">
			<i class="fa fa-calendar-times-o"></i>
			<p>No upcoming events available for registration at this time.</p>
		</div>
	{:else}
		<div class="events-grid">
			{#each data.events as event}
				<div class="event-card" class:registered={event.isRegistered}>
					<div class="event-details">
						<h3>{event.name}</h3>
						<div class="event-meta">
							<span class="meta-item">
								<i class="fa fa-calendar"></i>
								{new Date(event.startDate).toLocaleDateString()} - {new Date(
									event.endDate
								).toLocaleDateString()}
							</span>
							<span class="meta-item">
								<i class="fa fa-map-marker"></i>
								{event.location}
							</span>
							<span class="meta-item">
								<i class="fa fa-usd"></i>
								Cost: ${event.cost.toFixed(2)}
							</span>
						</div>

						{#if event.description}
							<p class="event-description">{event.description}</p>
						{/if}

						<div class="registration-info">
							{#if event.isRegistered}
								<span class="badge badge-success">
									<i class="fa fa-check"></i> Registered
								</span>
							{:else if event.registrationDueDate}
								<span class="due-date">
									Registration closes on {new Date(event.registrationDueDate).toLocaleString()}
								</span>
							{/if}
						</div>
					</div>

					<div class="event-actions">
						{#if event.isRegistered}
							<a href="/dashboard" class="btn btn-secondary btn-full">View My Registration</a>
						{:else}
							<form
								method="post"
								action="?/register"
								use:enhance={() => {
									registering = event.id;
									return async ({ update }) => {
										await update();
										registering = null;
									};
								}}
							>
								<input type="hidden" name="eventId" value={event.id} />
								<button
									type="submit"
									class="btn btn-primary btn-full"
									disabled={registering === event.id}
								>
									{#if registering === event.id}
										<i class="fa fa-spinner fa-pulse"></i> Registering...
									{:else}
										Register to Attend
									{/if}
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.compete-container {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		color: #212529;
		margin-bottom: 0.5rem;
		font-weight: 800;
	}

	.subtitle {
		color: #6c757d;
		font-size: 1.1rem;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.event-card {
		background: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 1rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.event-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
	}

	.event-card.registered {
		border-color: #2ea043;
		background-color: #f6ffed;
	}

	.event-details {
		padding: 1.5rem;
		flex-grow: 1;
	}

	.event-details h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #212529;
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #495057;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.meta-item i {
		color: #0d6efd;
		width: 1rem;
	}

	.event-description {
		font-size: 0.9rem;
		color: #6c757d;
		margin: 1rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.registration-info {
		margin-top: 1rem;
		font-size: 0.85rem;
	}

	.due-date {
		color: #dc3545;
		font-weight: 600;
	}

	.badge {
		display: inline-block;
		padding: 0.35em 0.65em;
		font-size: 0.75em;
		font-weight: 700;
		line-height: 1;
		color: #fff;
		text-align: center;
		white-space: nowrap;
		vertical-align: baseline;
		border-radius: 0.25rem;
	}

	.badge-success {
		background-color: #28a745;
	}

	.event-actions {
		padding: 1.5rem;
		border-top: 1px solid #eee;
	}

	.btn {
		display: inline-block;
		font-weight: 600;
		text-align: center;
		vertical-align: middle;
		cursor: pointer;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.btn-full {
		width: 100%;
	}

	.btn-primary {
		background-color: #0d6efd;
		color: white;
		border: none;
	}

	.btn-primary:hover {
		background-color: #0b5ed7;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
		border: none;
	}

	.btn-secondary:hover {
		background-color: #5c636a;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #f8f9fa;
		border-radius: 1rem;
		border: 2px dashed #dee2e6;
		color: #6c757d;
	}

	.empty-state i {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
</style>
