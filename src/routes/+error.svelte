<!--
	Installed from @auth/svelte@0.0.3
-->

<script lang="ts">
	import { page } from '$app/state';
</script>

<h1>{page.error?.message}</h1>
