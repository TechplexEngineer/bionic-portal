<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let newRoomName = $state("");
	let newRoomGender = $state("Boys");
	let submitting = $state(false);

	let assignedAttendeeIds = $derived(new Set(data.assignments.map((a) => a.studentId || a.userId)));
	let unassignedAttendees = $derived(
		data.attendees.filter((a) => !assignedAttendeeIds.has(a.userid))
	);

	function getAssignmentsForRoom(roomId: string) {
		return data.assignments
			.filter((a) => a.roomId === roomId)
			.map((a) => {
				const attendeeId = a.studentId || a.userId;
				return data.attendees.find((att) => att.userid === attendeeId);
			})
			.filter(Boolean);
	}

	function getRoomCapacity(gender: string | null) {
		if (gender === "Mentors") return data.event.mentorsPerRoom || 2;
		return data.event.studentsPerRoom || 4;
	}

	let attendeeFilter = $state("");
	let filteredUnassigned = $derived(
		unassignedAttendees.filter((a) =>
			`${a.firstName} ${a.lastName}`.toLowerCase().includes(attendeeFilter.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Room Assignments | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="container-fluid py-4">
	<header class="d-flex justify-content-between align-items-end mb-4 pb-3 border-bottom">
		<div>
			<h1 class="display-5 fw-bold mb-0">Room Assignments</h1>
			<p class="text-muted mb-0">{data.event.name} • overnight</p>
		</div>
		<div>
			<a href="/admin/events" class="btn btn-outline-secondary btn-sm">Back to Events</a>
		</div>
	</header>

	<div class="row g-4">
		<!-- Attendee Sidebar -->
		<aside class="col-lg-4 col-xl-3">
			<div class="card h-100 shadow-sm">
				<div class="card-header bg-white py-3">
					<h2 class="h5 mb-3 text-primary">Attendees ({unassignedAttendees.length} unassigned)</h2>
					<input
						type="text"
						bind:value={attendeeFilter}
						placeholder="Filter attendees..."
						class="form-control"
					/>
				</div>

				<div class="card-body p-0 overflow-auto" style="max-height: calc(100vh - 350px);">
					<div class="list-group list-group-flush">
						{#each filteredUnassigned as attendee}
							<div class="list-group-item d-flex justify-content-between align-items-center py-3">
								<div>
									<div class="fw-semibold">{attendee.firstName} {attendee.lastName}</div>
									<span
										class="badge {attendee.type === 'student'
											? 'bg-primary-subtle text-primary'
											: 'bg-info-subtle text-info'} text-uppercase"
										style="font-size: 0.65rem;"
									>
										{attendee.type}
									</span>
								</div>
								<div class="dropdown">
									<button
										class="btn btn-sm btn-outline-primary dropdown-toggle"
										type="button"
										data-bs-toggle="dropdown"
										aria-expanded="false"
									>
										Assign
									</button>
									<ul class="dropdown-menu dropdown-menu-end shadow">
										{#each data.rooms as room}
											<li>
												<form method="POST" action="?/assignAttendee" use:enhance>
													<input type="hidden" name="roomId" value={room.id} />
													<input type="hidden" name="attendeeId" value={attendee.userid} />
													<input type="hidden" name="attendeeType" value={attendee.type} />
													<button
														class="dropdown-item d-flex justify-content-between align-items-center"
														type="submit"
														disabled={getAssignmentsForRoom(room.id).length >=
															getRoomCapacity(room.gender)}
													>
														<span>{room.roomName}</span>
														<small class="text-muted ms-2"
															>({getAssignmentsForRoom(room.id).length}/{getRoomCapacity(
																room.gender
															)})</small
														>
													</button>
												</form>
											</li>
										{/each}
										{#if data.rooms.length === 0}
											<li><span class="dropdown-item disabled">No rooms created</span></li>
										{/if}
									</ul>
								</div>
							</div>
						{/each}
						{#if filteredUnassigned.length === 0}
							<div class="p-4 text-center text-muted">No unassigned attendees found</div>
						{/if}
					</div>
				</div>
			</div>
		</aside>

		<!-- Rooms Grid -->
		<main class="col-lg-8 col-xl-9">
			<div class="card shadow-sm mb-4">
				<div class="card-body d-flex justify-content-between align-items-center py-3">
					<h2 class="h5 mb-0">Rooms</h2>
					<form
						method="POST"
						action="?/createRoom"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
								newRoomName = "";
							};
						}}
						class="d-flex gap-2"
					>
						<input
							type="text"
							name="roomName"
							bind:value={newRoomName}
							placeholder="Room Name"
							class="form-control form-control-sm"
							required
						/>
						<select
							name="gender"
							bind:value={newRoomGender}
							class="form-select form-select-sm"
							style="width: auto;"
						>
							<option>Boys</option>
							<option>Girls</option>
							<option>Mentors</option>
						</select>
						<button type="submit" class="btn btn-primary btn-sm" disabled={submitting}
							>Add Room</button
						>
					</form>
				</div>
			</div>

			<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
				{#each data.rooms as room}
					{@const currentAssignments = getAssignmentsForRoom(room.id)}
					{@const capacity = getRoomCapacity(room.gender)}
					<div class="col">
						<div
							class="card h-100 shadow-sm border-top border-4 {room.gender === 'Boys'
								? 'border-primary'
								: room.gender === 'Girls'
									? 'border-danger'
									: 'border-info'}"
						>
							<div
								class="card-header bg-white d-flex justify-content-between align-items-center py-3"
							>
								<h3 class="h6 mb-0 fw-bold">{room.roomName}</h3>
								<span
									class="badge rounded-pill {room.gender === 'Boys'
										? 'bg-primary-subtle text-primary'
										: room.gender === 'Girls'
											? 'bg-danger-subtle text-danger'
											: 'bg-info-subtle text-info'} text-uppercase"
									style="font-size: 0.7rem;"
								>
									{room.gender}
								</span>
							</div>
							<div class="card-body">
								<div class="list-group list-group-flush border rounded overflow-hidden">
									{#each Array(capacity) as _, i}
										{@const person = currentAssignments[i]}
										<div
											class="list-group-item d-flex justify-content-between align-items-center py-2 {person
												? ''
												: 'bg-light text-muted small py-3'}"
											style="min-height: 50px;"
										>
											{#if person}
												<span class="fw-semibold">{person.firstName} {person.lastName}</span>
												<form method="POST" action="?/unassignAttendee" use:enhance>
													<input type="hidden" name="attendeeId" value={person.userid} />
													<input type="hidden" name="attendeeType" value={person.type} />
													<button
														type="submit"
														class="btn btn-link link-danger p-0 text-decoration-none"
														title="Unassign"
													>
														<i class="fa fa-times-circle"></i>
													</button>
												</form>
											{:else}
												<span class="opacity-50 fst-italic mx-auto">Empty Slot</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/each}
				{#if data.rooms.length === 0}
					<div class="col-12 text-center py-5 bg-light rounded border-2 border-dashed">
						<i class="fa fa-hotel fa-4x text-muted opacity-25 mb-3"></i>
						<p class="text-muted">No rooms have been added to this event yet.</p>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	/* Minimized custom styles */
	.border-dashed {
		border-style: dashed !important;
	}
</style>
