<!--
	Installed from @auth/svelte@0.0.3
-->

<script lang="ts">
	import { AvatarRoot as ArkAvatarRoot, type AvatarRootProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { class: className, ...restProps }: AvatarRootProps = $props();
</script>

<ArkAvatarRoot
	class={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
	{...restProps}
/>
