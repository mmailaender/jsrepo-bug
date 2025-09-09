<!--
	Installed from @auth/svelte@0.0.3
-->

<script lang="ts">
	import { cn } from '$lib/primitives/utils.js';
	import type { ImageCropperControlsProps } from './types';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: ImageCropperControlsProps = $props();
</script>

<div
	{...rest}
	bind:this={ref}
	class={cn('flex w-full place-items-center justify-center gap-2', className)}
>
	{@render children?.()}
</div>
