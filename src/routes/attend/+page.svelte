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

	const locations = data.locations;
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

<div class="container-fluid mx-auto">
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

			<div class="d-flex justify-content-between align-items-center">
				<h2>Here</h2>
				<span class="badge bg-secondary rounded-pill">
					{data.membersHere.length}
				</span>
			</div>
			<TableForObjectArray data={data.membersHere} columns={hereColumns} searchable={false} />
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
		</div>
		<div class="col">
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
