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
	<p class="lead">
		Team 4909 Billerica Bionic is a <em>FIRST</em> Robotics Competition team based in Billerica, MA.<br
		/>
		"Using robots to build kids" - <em>Dean Kamen</em>
	</p>

	<div class="row">
		<div class="col-md-4 mb-3">
			{@render card("For Parents", [
				"See upcoming events",
				"Register your student to compete",
				"Sign up to volunteer",
				"View student attendance"
			])}

			<!-- <div class="card h-100">
				<div class="card-body">
					<h5 class="card-title">For Parents</h5>
					<div class="card-text">
						<ul>
							<li>See upcoming events</li>
							<li>Register your student to compete</li>
							<li>Sign up to volunteer</li>
							<li>View student attendance</li>
						</ul>
					</div>
					<a href="/register" class="btn btn-primary">Register</a>
					<a href="/login" class="btn btn-primary">Login</a>
				</div>
			</div> -->
		</div>

		<div class="col-md-4 mb-3">
			{@render card("For Students", ["Sign up for events", "View your attendance history"])}

			<!-- <div class="card h-100">
				<div class="card-body">
					<h5 class="card-title">For Students</h5>
					<div class="card-text">
						<ul>
							<li>Sign up for events</li>
							<li>View your attendance history</li>
						</ul>
					</div>
					<a href="/register" class="btn btn-primary">Register</a>
					<a href="/login" class="btn btn-primary">Login</a>
				</div>
			</div>
		-->
		</div>

		<div class="col-md-4 mb-3">
			<h3>Upcoming Events</h3>
			{#each data.events as evt}
				{#if new Date(evt.dateStr).getTime() > Date.now() - oneDayMiliseconds}
					<CountdownCard name={evt.name} date={evt.dateStr} />
				{/if}
			{/each}
		</div>
	</div>
	<iframe
		id="calendar-iframe"
		title="Team 4909 Calendar"
		src="https://calendar.google.com/calendar/embed?src=team4909%40gmail.com&ctz=America%2FNew_York"
		style="border: 0"
		width="100%"
		frameborder="0"
		scrolling="no"
	></iframe>
</div>

<style>
	#calendar-iframe {
		aspect-ratio: 16 / 9;
	}
</style>

{#snippet card(eventName: string, actions: string[])}
	<div class="card h-100">
		<div class="card-header bg-white d-flex">
			<h2 class="h5 fw-bold mb-0 text-dark">{eventName}</h2>
		</div>
		<div class="card-body py-2">
			<div class="d-flex flex-column gap-2 text-secondary small">
				<ul>
					{#each actions as action}
						<li class="d-flex align-items-center gap-2">
							<span class="s-Lgf0i2eTvRtO">{action}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<div class="card-footer bg-white border-top-0 pt-0 pb-3">
			<div
				class="d-flex flex-wrap gap-2 justify-content-end align-items-center pt-3 border-top mt-2"
			>
				<a class="btn btn-outline-secondary btn-sm" href="/login"
					><i class="fa fa-user me-1"></i> Login</a
				>
				<a class="btn btn-outline-secondary btn-sm" href="/register"
					><i class="fa fa-user-plus me-1"></i> Register</a
				>
			</div>
		</div>
	</div>
{/snippet}
