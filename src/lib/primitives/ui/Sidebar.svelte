<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	interface Props {
		currentSection?: string;
	}

	let { currentSection = 'Profile' }: Props = $props();
</script>

<aside
	class="rounded-base-l-container w-full border-r border-surface-400-600 bg-surface-200-800 p-6 md:w-1/4"
>
	<ul>
		<li class="mb-4 font-semibold text-surface-800-200">Account</li>
		<li class="text-surface-600-400">{currentSection}</li>
		<li class="mt-4 text-surface-800-200">Security</li>
	</ul>
</aside>
