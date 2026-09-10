<script lang="ts">
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import "../styles/bootstrap.scss";
	import "@fortawesome/fontawesome-free/css/all.css";
	import "../styles/app.css";
	import type { LayoutProps } from "./$types";

	let { data, children }: LayoutProps = $props();

	onMount(async () => {
		if (!browser) return;

		// this is enough for most components
		await import("bootstrap");

		// some components require a bootstrap instance, to fulfil their job. In that case, use this:
		// const bootstrap = await import("bootstrap");
		// sample usage:
		// const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
	});
</script>

<Header user={data.user} />
{@render children()}
<Footer />
