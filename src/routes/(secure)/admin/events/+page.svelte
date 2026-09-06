<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let deletingId = $state("");
</script>

<svelte:head>
	<title>Events | Admin | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<h1 class="display-5 fw-bold mb-0 text-dark">Events Management</h1>
		<div class="d-flex gap-2">
			<a href="/admin/events/import" class="btn btn-outline-secondary">
				<i class="fa fa-upload me-2"></i> Import Events
			</a>
			<a href="/admin/events/add" class="btn btn-primary shadow-sm">
				<i class="fa fa-plus me-2"></i> Add Event
			</a>
		</div>
	</header>

	<main>
		{#if data.events.length === 0}
			<div class="text-center py-5 bg-light rounded border border-2 border-dashed">
				<i class="fa fa-calendar-alt fa-4x text-muted opacity-25 mb-3"></i>
				<p class="lead text-muted">No events found. Create your first event!</p>
				<a href="/admin/events/add" class="btn btn-primary mt-2">Add Event</a>
			</div>
		{:else}
			<div class="row row-cols-1 row-cols-lg-2 g-4">
				{#each data.events as event}
					<div class="col">
						<div class="card h-100 shadow-sm border-0 transition-hover">
							<div
								class="card-header bg-white py-3 d-flex justify-content-between align-items-start border-bottom-0"
							>
								<h2 class="h5 fw-bold mb-0 text-dark">{event.name}</h2>
								<span
									class="badge rounded-pill {event.isOvernight
										? 'bg-primary-subtle text-primary'
										: 'bg-success-subtle text-success'} text-uppercase"
									style="font-size: 0.65rem;"
								>
									{event.isOvernight ? "Overnight" : "Day Event"}
								</span>
							</div>

							<div class="card-body py-2">
								<div class="d-flex flex-column gap-2 text-secondary small">
									<div class="d-flex align-items-center gap-2">
										<i class="fa fa-calendar text-primary" style="width: 14px;"></i>
										<span>{event.startDate} - {event.endDate}</span>
									</div>
									<div class="d-flex align-items-center gap-2">
										<i class="fa fa-map-marker-alt text-primary" style="width: 14px;"></i>
										<span>{event.location}</span>
									</div>
									{#if event.departureTime}
										<div class="d-flex align-items-center gap-2">
											<i class="fa fa-clock text-primary" style="width: 14px;"></i>
											<span>Departure: {new Date(event.departureTime).toLocaleString()}</span>
										</div>
									{/if}
									{#if event.registrationDueDate}
										<div class="d-flex align-items-center gap-2">
											<i class="fa fa-hourglass-half text-primary" style="width: 14px;"></i>
											<span>Reg Due: {new Date(event.registrationDueDate).toLocaleString()}</span>
										</div>
									{/if}
								</div>
							</div>

							<div class="card-footer bg-white border-top-0 pt-0 pb-3">
								<div
									class="d-flex flex-wrap gap-2 justify-content-end align-items-center pt-3 border-top mt-2"
								>
									<a
										href="/admin/events/{event.id}/registrations"
										class="btn btn-outline-secondary btn-sm"
									>
										<i class="fa fa-users me-1"></i> Regs
									</a>
									<a
										href="/admin/events/{event.id}/carpools"
										class="btn btn-outline-secondary btn-sm"
									>
										<i class="fa fa-car me-1"></i> Carpools
									</a>
									{#if event.isOvernight}
										<a
											href="/admin/events/{event.id}/rooms"
											class="btn btn-outline-secondary btn-sm"
										>
											<i class="fa fa-bed me-1"></i> Rooms
										</a>
									{/if}
									<div class="ms-auto d-flex gap-2">
										<a
											href="/admin/events/{event.id}/edit"
											class="btn btn-sm btn-link link-primary p-0"
											title="Edit"
											aria-label="Edit Event"
										>
											<i class="fa fa-edit fa-lg"></i>
										</a>
										<form
											method="post"
											action="?/delete"
											use:enhance={({ cancel }) => {
												if (
													!confirm(
														"Are you sure you want to delete this event? This action cannot be undone."
													)
												) {
													cancel();
													return;
												}

												deletingId = event.id;
												return async ({ update }) => {
													await update();
													deletingId = "";
												};
											}}
											class="d-inline"
										>
											<input type="hidden" name="id" value={event.id} />
											<button
												type="submit"
												class="btn btn-sm btn-link link-danger p-0"
												title="Delete"
												aria-label="Delete Event"
												disabled={deletingId === event.id}
											>
												{#if deletingId === event.id}
													<i class="fa fa-spinner fa-pulse"></i>
												{:else}
													<i class="fa fa-trash fa-lg"></i>
												{/if}
											</button>
										</form>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.transition-hover {
		transition:
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.2s ease;
	}
	.transition-hover:hover {
		transform: translateY(-5px);
		box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
	}
</style>
