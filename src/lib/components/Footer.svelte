<script lang="ts">
	import { resolve } from "$app/paths";
</script>

<footer class="border-top mt-5 py-4">
	<div
		class="container d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2"
	>
		<small class="text-body-secondary"
			>&copy; {new Date().getFullYear()} Team 4909 Bionic Robotics</small
		>
		<a href={resolve("/register/mentor")} class="link-secondary">Mentor registration</a>
	</div>
</footer>
