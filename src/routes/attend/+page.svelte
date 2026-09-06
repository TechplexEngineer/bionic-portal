<script lang="ts">
	import { headerState } from "$lib/components/Header.svelte";
	import type { TableColumns } from "$lib/components/TableForObjectArray.svelte";
	import { onMount } from "svelte";
	import type { PageProps } from "./$types";
	import { invalidateAll } from "$app/navigation";
	import { enhance } from "$app/forms";
	import TableForObjectArray from "$lib/components/TableForObjectArray.svelte";
	import CountdownCard from "$lib/components/CountdownCard.svelte";
	import uFuzzy from "@leeoniya/ufuzzy";

	let { data, form }: PageProps = $props();

	headerState.loginVisible = false;

	const notHereColumns: TableColumns = [
		{ data: "name", title: "Name" },
		{ data: "id", title: "", renderSnippet: action }
	];

	const hereColumns: TableColumns = [{ data: "name", title: "Name" }];

	const oneDayMiliseconds = 24 * 60 * 60 * 1000; // milliseconds in a day

	const FIVE_MINUTES = 5 * 60 * 1000;
	console.log("Setting up data invalidation interval for attendance page");
	onMount(() => {
		const interval = setInterval(() => {
			invalidateAll();
			console.log("Data invalidated for attendance page");
		}, FIVE_MINUTES);

		return () => clearInterval(interval);
	});

	let filterText = $state("");

	let filteredMembersNotHere = $derived.by(() =>
		data.membersNotHere.filter((member) =>
			member.name.toLowerCase().includes(filterText.toLowerCase())
		)
	);

	let shopSearch = $state("");

	const locations = [
		{
			location: "W1-A",
			item: "Gear Motors"
		},
		{
			location: "W2-A",
			item: "Network Switch"
		},
		{
			location: "W3-A",
			item: "Wire Loom"
		},
		{
			location: "W4-A",
			item: "Empty"
		},
		{
			location: "W5-A",
			item: "Tape"
		},
		{
			location: "W6-A",
			item: "Empty"
		},
		{
			location: "W7-A",
			item: "Churro Locker"
		},
		{
			location: "W8-A",
			item: "Dell Docks"
		},
		{
			location: "W9-A",
			item: "Oversized HTD"
		},
		{
			location: "W10-A",
			item: "Odd Bolts"
		},
		{
			location: "W11-A",
			item: "Zip Square, & Nylon HW"
		},
		{
			location: "W12-A",
			item: "Tormach"
		},
		{
			location: "W1-B",
			item: "Mini-CIM 7 Bag"
		},
		{
			location: "W2-B",
			item: "Empty"
		},
		{
			location: "W3-B",
			item: "Igus"
		},
		{
			location: "W4-B",
			item: "Mac Mini & Speakers"
		},
		{
			location: "W5-B",
			item: "Tape, Gaffers"
		},
		{
			location: "W6-B",
			item: "Empty"
		},
		{
			location: "W7-B",
			item: "1/4-20 Overflow"
		},
		{
			location: "W8-B",
			item: "Empty"
		},
		{
			location: "W9-B",
			item: "5/16 Bolts, Dust Collector"
		},
		{
			location: "W10-B",
			item: "Empty"
		},
		{
			location: "W11-B",
			item: "Nylon HW"
		},
		{
			location: "W12-B",
			item: "Prusa (Combine with W4-D)"
		},
		{
			location: "W1-C",
			item: "CIM Motors"
		},
		{
			location: "W2-C",
			item: "Empty"
		},
		{
			location: "W3-C",
			item: "Swerve"
		},
		{
			location: "W4-C",
			item: "Old, Not Forgotten"
		},
		{
			location: "W5-C",
			item: "Grinding Wheels"
		},
		{
			location: "W6-C",
			item: "80/20"
		},
		{
			location: "W7-C",
			item: "Rivet Overflow"
		},
		{
			location: "W8-C",
			item: "Odd Hardware"
		},
		{
			location: "W9-C",
			item: "Empty"
		},
		{
			location: "W10-C",
			item: "Vernier Scale"
		},
		{
			location: "W11-C",
			item: "Odd Hardware"
		},
		{
			location: "W12-C",
			item: "Lathe Legs (Combine with Tormach?)"
		},
		{
			location: "W1-D",
			item: "775 Motors"
		},
		{
			location: "W2-D",
			item: "Short Ethernet"
		},
		{
			location: "W3-D",
			item: "Empty"
		},
		{
			location: "W4-D",
			item: "Prusa"
		},
		{
			location: "W5-D",
			item: "Grease"
		},
		{
			location: "W6-D",
			item: "Bags"
		},
		{
			location: "W7-D",
			item: "#10-32 Overflow"
		},
		{
			location: "W8-D",
			item: "Electronics Overflow"
		},
		{
			location: "W9-D",
			item: "Empty"
		},
		{
			location: "W10-D",
			item: "Empty"
		},
		{
			location: "W11-D",
			item: "HW Nylon"
		},
		{
			location: "W12-D",
			item: "Plywood Spacers"
		},
		{
			location: "W1-E",
			item: "Gear Motors"
		},
		{
			location: "W2-E",
			item: "Port Savers"
		},
		{
			location: "W3-E",
			item: "Wire Management"
		},
		{
			location: "W4-E",
			item: "Backpack"
		},
		{
			location: "W5-E",
			item: "Glue"
		},
		{
			location: "W6-E",
			item: "Decorations"
		},
		{
			location: "W7-E",
			item: "#8-32 Overflow"
		},
		{
			location: "W8-E",
			item: "Empty"
		},
		{
			location: "W9-E",
			item: "Spacer Overflow"
		},
		{
			location: "W10-E",
			item: "Empty"
		},
		{
			location: "W11-E",
			item: "Grommet"
		},
		{
			location: "W12-E",
			item: "Empty"
		},
		{
			location: "W1-F",
			item: "Gear Boxes"
		},
		{
			location: "W2-F",
			item: "Empty"
		},
		{
			location: "W3-F",
			item: "Brushes"
		},
		{
			location: "W4-F",
			item: "Cinder Blocks"
		},
		{
			location: "W5-F",
			item: "Office, Label Tape, Zip Squares"
		},
		{
			location: "W6-F",
			item: "Trays"
		},
		{
			location: "W7-F",
			item: "Misc HW Overflow"
		},
		{
			location: "W8-F",
			item: "Old Hardware"
		},
		{
			location: "W9-F",
			item: "Bearing Overflow"
		},
		{
			location: "W10-F",
			item: "Empty"
		},
		{
			location: "W11-F",
			item: "Hardware"
		},
		{
			location: "W12-F",
			item: "4-Jaw Chuck"
		}
	];

	const uf = new uFuzzy();

	type Location = (typeof locations)[number];

	let filteredLocations = $derived.by((): Location[] => {
		if (shopSearch.trim() === "") {
			return locations;
		}
		const haystack = locations.map((l) => l.item);
		const idxs = uf.search(haystack, shopSearch)[0] ?? [];

		return idxs?.map((idx) => locations[idx]) ?? [];

		console.log("Shop search for:", shopSearch);
		console.log("Matched indexes:", idxs);
		// idxs can be null when the needle is non-searchable (has no alpha-numeric chars)
		if (idxs != null && idxs.length > 0) {
			// sort/rank only when <= 1,000 items
			let infoThresh = 1e3;

			// if (idxs.length <= infoThresh) {
			// 	let info = uf.info(idxs, haystack, shopSearch);

			// 	// order is a double-indirection array (a re-order of the passed-in idxs)
			// 	// this allows corresponding info to be grabbed directly by idx, if needed
			// 	let order = uf.sort(info, haystack, shopSearch);

			// 	// render post-filtered & ordered matches
			// 	for (let i = 0; i < order.length; i++) {
			// 		// using info.idx here instead of idxs because uf.info() may have
			// 		// further reduced the initial idxs based on prefix/suffix rules
			// 		console.log(haystack[info.idx[order[i]]]);
			// 	}
			// } else {
			// render pre-filtered but unordered matches
			for (let i = 0; i < idxs.length; i++) {
				console.log(haystack[idxs[i]]);
			}
			// }
		}
	});
</script>

<svelte:head>
	<title>Checkin : BionicPortal</title>
</svelte:head>

{#snippet action(memberId: string)}
	<form
		action="?/checkin"
		method="post"
		use:enhance
		onsubmit={() =>
			setTimeout(() => {
				filterText = "";
			}, 100)}
	>
		<input type="hidden" name="userid" value={memberId} />
		<button class="btn btn-sm btn-primary" type="submit">Check In</button>
	</form>
{/snippet}

<div class="container mx-auto">
	<div class="row">
		<div class="col">
			{#if form?.error}
				<div class="alert alert-danger" role="alert">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">Checked in successfully!</div>
			{/if}
			<div class="d-flex justify-content-between align-items-center">
				<a href="/attend/register" class="btn btn-sm btn-secondary me-1">Register</a>

				<input
					type="text"
					class="form-control me-2"
					placeholder="Filter members..."
					bind:value={filterText}
				/>
			</div>

			<TableForObjectArray data={filteredMembersNotHere} columns={notHereColumns} />
		</div>
		<div class="col">
			<div class="d-flex justify-content-between align-items-center">
				<h2>Here</h2>
				<span class="badge bg-secondary rounded-pill">
					{data.membersHere.length}
				</span>
			</div>
			<TableForObjectArray data={data.membersHere} columns={hereColumns} />
		</div>
		<div class="col">
			<div class="overflow-y-auto" style="max-height: 50vh;">
				<h2>Upcomming Events</h2>
				{#each data.events as evt}
					{#if new Date(evt.dateStr).getTime() > Date.now() - oneDayMiliseconds}
						<CountdownCard name={evt.name} date={evt.dateStr} />
					{/if}
				{/each}
			</div>
			<div>
				<h2>Shop Search</h2>
				<input
					type="text"
					class="form-control me-2"
					placeholder="Filter locations..."
					bind:value={shopSearch}
				/>
				{#each filteredLocations as loc}
					<div class="border p-2 my-1">
						<strong>{loc.location}:</strong>
						{loc.item}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- <form action="?/checkin" method="post">
		<div class="input-group mb-3">
			<input
				autocomplete="off"
				type="text"
				class="form-control"
				placeholder="User ID"
				name="userid"
				autofocus
				required
				min="3"
			/>
			<button class="btn btn-primary" type="submit">Check In</button>
		</div>
	</form> -->
</div>
