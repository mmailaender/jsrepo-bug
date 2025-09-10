<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	import {
		DialogDescription as ArkDialogDescription,
		type DialogDescriptionProps
	} from '@ark-ui/svelte/dialog';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: DialogDescriptionProps = $props();
</script>

<ArkDialogDescription
	bind:ref
	data-slot="dialog-description"
	class={cn('w-full text-left text-sm text-surface-600-400', className)}
	{...restProps}
/>
