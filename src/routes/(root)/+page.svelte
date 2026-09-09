<script lang="ts">
	import type { PageProps } from "./$types";
	import CountdownCard from "$lib/components/CountdownCard.svelte";

	let { data }: PageProps = $props();

	const oneDayMiliseconds = 24 * 60 * 60 * 1000; // milliseconds in a day
</script>

<svelte:head>
	<title>Home | Team 4909</title>
	<meta
		name="description"
		content="Team 4909 Bionic Robotics is a FIRST Robotics Competition team based in Billerica, MA. We build robots, compete in FRC events, and promote STEM education."
	/>
</svelte:head>

<div class="container">
	<h1>Welcome to Team 4909</h1>
	<p class="lead">"Using robots to build kids"</p>

	<div class="row g-4 align-items-start">
		<div class="col-md-8">
			<div class="row g-4 mb-4">
				<div class="col-md-4">
					<div class="card h-100">
						<div class="card-body d-flex flex-column">
							<h3 class="h5 card-title">New Team Member</h3>
							<a href="/register" class="btn btn-primary mt-auto w-100">Register</a>
						</div>
					</div>
				</div>
				<div class="col-md-4">
					<div class="card h-100">
						<div class="card-body d-flex flex-column">
							<h3 class="h5 card-title">Returning Member</h3>
							<a href="/login" class="btn btn-primary mt-auto w-100">Login</a>
						</div>
					</div>
				</div>
				<div class="col-md-4">
					<div class="card h-100">
						<div class="card-body d-flex flex-column">
							<h3 class="h5 card-title">Mentor</h3>
							<a href="/register/mentor" class="btn btn-primary mt-auto w-100">Register</a>
						</div>
					</div>
				</div>
			</div>
			<h3>Calendar</h3>
			<iframe
				id="calendar-iframe"
				title="Team 4909 Calendar"
				src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FNew_York&title=Team%204909&showTz=0&showCalendars=0&src=dGVhbTQ5MDlAZ21haWwuY29t&color=%230b8043"
				frameborder="0"
				scrolling="no"
			></iframe>
		</div>

		<div class="col-md-4">
			<h3>Upcoming Events</h3>
			{#each data.events as evt}
				{#if new Date(evt.dateStr).getTime() > Date.now() - oneDayMiliseconds}
					<CountdownCard name={evt.name} date={evt.dateStr} />
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	#calendar-iframe {
		width: 100%;
		aspect-ratio: 16 / 10;
		border: 0;
	}
</style>
