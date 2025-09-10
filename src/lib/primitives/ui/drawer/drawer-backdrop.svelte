<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	import {
		DialogBackdrop as ArkDialogBackdrop,
		type DialogBackdropProps
	} from '@ark-ui/svelte/dialog';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: DialogBackdropProps = $props();
</script>

<ArkDialogBackdrop
	bind:ref
	data-scope="drawer"
	class={cn(
		'fixed inset-0 z-50 bg-surface-950/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
		className
	)}
	{...restProps}
/>
