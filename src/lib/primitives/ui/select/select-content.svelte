<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	import { Select, type SelectContentProps } from '@ark-ui/svelte/select';
	import { cn, type WithoutChild } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<SelectContentProps> = $props();
</script>

<Select.Content
	bind:ref
	data-slot="select-content"
	class={cn(
		'relative z-50 max-h-(--available-height) w-(--reference-width) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-container border border-surface-300-700 bg-surface-100-900 p-1 shadow-md data-[side=bottom]:translate-y-1 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:-translate-x-1 data-[side=left]:slide-in-from-right-2 data-[side=right]:translate-x-1 data-[side=right]:slide-in-from-left-2 data-[side=top]:-translate-y-1 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Select.Content>
