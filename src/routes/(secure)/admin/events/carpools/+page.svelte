<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	function getSpot(eventId: string, mentorId: string) {
		return data.carpoolSpots.find((s) => s.eventId === eventId && s.mentorId === mentorId);
	}

	let mentorSearch = $state("");
	let filteredMentors = $derived(
		data.mentors.filter((mentor) =>
			mentor.username.toLowerCase().includes(mentorSearch.trim().toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Carpool Grid | Admin | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4">
		<h1>Carpool Signup</h1>
		<a href="/admin/events" class="btn btn-outline-secondary">Back to Events</a>
	</header>

	<main class="card shadow-sm overflow-hidden">
		<div class="p-3 border-bottom">
			<label class="form-label mb-1" for="mentor-search">Search mentors</label>
			<input
				id="mentor-search"
				class="form-control"
				type="search"
				placeholder="Search mentors..."
				bind:value={mentorSearch}
			/>
		</div>
		<div class="table-responsive">
			<table class="table table-hover table-bordered mb-0 align-middle">
				<thead class="table-light">
					<tr>
						<th class="sticky-col bg-light border-end shadow-sm">Mentor</th>
						{#each data.events as event, i}
							<th class="text-center p-3">
								<div class="d-flex flex-column gap-1">
									<span
										class="badge bg-primary-subtle text-primary text-uppercase"
										style="font-size: 0.65rem;">Week {i}</span
									>
									<div class="fw-bold text-nowrap">{event.name}</div>
									<small class="text-muted"
										>{new Date(event.startDate).toLocaleDateString(undefined, {
											month: "numeric",
											day: "numeric"
										})}</small
									>
									<a
										href="/admin/events/{event.id}/carpools"
										class="btn btn-link btn-sm p-0 mt-1"
										style="font-size: 0.75rem;">Manage</a
									>
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					<tr class="table-light opacity-75">
						<td class="sticky-col bg-light border-end fw-bold shadow-sm">Location</td>
						{#each data.events as event}
							<td class="text-center"><small>{event.location}</small></td>
						{/each}
					</tr>

					{#each filteredMentors as mentor (mentor.id)}
						<tr>
							<td class="sticky-col bg-white border-end fw-semibold shadow-sm">{mentor.username}</td
							>
							{#each data.events as event}
								<td class="p-0">
									<form method="post" action="?/saveSpot" use:enhance>
										<input type="hidden" name="eventId" value={event.id} />
										<input type="hidden" name="mentorId" value={mentor.id} />
										<input
											type="text"
											name="capacity"
											class="form-control border-0 text-center py-3 rounded-0 bg-transparent"
											value={getSpot(event.id, mentor.id)?.capacity ?? ""}
											placeholder="Qty"
											onchange={(e) => e.currentTarget.form?.requestSubmit()}
										/>
									</form>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</main>
</div>

<style>
	.sticky-col {
		position: sticky;
		left: 0;
		z-index: 5;
		min-width: 180px;
	}

	/* Ensure the form control placeholder is subtle */
	.form-control::placeholder {
		opacity: 0.3;
	}

	/* Optional: focus indicator for the borderless input */
	.form-control:focus {
		box-shadow: inset 0 0 0 2px rgba(13, 110, 253, 0.25);
		background-color: rgba(13, 110, 253, 0.05) !important;
	}
</style>
