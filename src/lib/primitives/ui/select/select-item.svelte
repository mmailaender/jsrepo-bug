<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Select, type SelectItemProps } from '@ark-ui/svelte/select';
	import { cn } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: SelectItemProps = $props();
</script>

<Select.Item
	bind:ref
	data-slot="select-item"
	class={cn(
		"[&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-base py-1.5 pr-8 pl-2 text-sm text-surface-800-200 outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-200-800 data-[highlighted]:text-surface-950-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Select.Item>
