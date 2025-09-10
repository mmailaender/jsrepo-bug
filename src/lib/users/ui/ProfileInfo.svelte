<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	// Svelte
	import { tick } from 'svelte';

	// API
	import { api } from '../../../convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { authClient } from '../../auth/api/auth-client';
	const client = useConvexClient();

	// Icons
	import { Pencil } from '@lucide/svelte';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '../../primitives/ui/avatar';
	import * as ImageCropper from '../../primitives/ui/image-cropper';
	import { getFileFromUrl } from '../../primitives/ui/image-cropper';

	// Utils
	import { optimizeImage } from '../../primitives/utils/optimizeImage';

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import type { FunctionReturnType } from 'convex/server';
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	// Props
	let { initialData }: { initialData?: UserResponse } = $props();

	// Query
	const activeUserResponse = useQuery(api.users.queries.getActiveUser, {}, { initialData });
	// Derived state
	const activeUser = $derived(activeUserResponse.data);

	// State
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let loadingStatus = $state('loading');
	let isUploading: boolean = $state(false);
	let cropSrc: string = $state('');

	let nameInputEl: HTMLInputElement | null = $state(null);

	let avatarKey: number = $state(0); // Force re-render when image changes

	// Initialize state when user data is available
	$effect(() => {
		if (activeUser && !isEditingName) {
			name = activeUser.name;
		}
	});

	// Keep crop preview in sync with current user image
	$effect(() => {
		if (activeUser?.image) {
			cropSrc = activeUser.image;
		}
	});

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		try {
			await authClient.updateUser({ name });
			isEditingName = false;
			toast.success('Profile name updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update profile: ${errorMsg}`);
		}
	}

	// Handle cropped image from ImageCropper
	async function handleCropped(url: string): Promise<void> {
		try {
			isUploading = true;
			// Convert cropped URL to File, then optimize and upload
			const croppedFile = await getFileFromUrl(url, 'avatar.png');
			const optimizedFile = await optimizeImage(croppedFile, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimizedFile.type },
				body: optimizedFile
			});
			if (!response.ok) throw new Error('Failed to upload file');

			const result = await response.json();
			const storageId = result.storageId as Id<'_storage'>;
			const imageUrl = await client.mutation(api.users.mutations.updateAvatar, { storageId });
			await authClient.updateUser({ image: imageUrl });

			loadingStatus = 'loading';
			avatarKey += 1;
			cropSrc = imageUrl;
			toast.success('Avatar updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${errorMsg}`);
			loadingStatus = 'error';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !activeUser}
		<div class="h-16 w-full animate-pulse rounded-base bg-success-200-800"></div>
	{:else}
		<!-- Avatar + Upload via ImageCropper (rounded crop) -->
		<div class="flex items-center justify-start rounded-base pt-6 pl-0.5">
			<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={handleCropped}>
				<ImageCropper.UploadTrigger>
					<div
						class="relative size-20 cursor-pointer rounded-container transition-all duration-200"
					>
						<div class="relative cursor-pointer transition-colors">
							{#key avatarKey}
								<Avatar.Root class="size-20" onStatusChange={(e) => (loadingStatus = e.status)}>
									<Avatar.Image src={activeUser.image} alt={activeUser.name} />
									<Avatar.Fallback
										class="rounded-container bg-surface-300-700 duration-150 ease-in-out hover:bg-surface-400-600/80"
									>
										<Avatar.Marble name={activeUser.name} />
									</Avatar.Fallback>
								</Avatar.Root>
							{/key}

							{#if isUploading || loadingStatus === 'loading'}
								<div
									class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-surface-50-950"
								>
									<div
										class="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"
									></div>
								</div>
							{/if}

							<div
								class="absolute -right-1.5 -bottom-1.5 badge-icon size-3 rounded-full preset-filled-surface-300-700 ring-4 ring-surface-50-950 hover:bg-surface-400-600 dark:ring-surface-100-900"
							>
								<Pencil class="size-4" />
							</div>
						</div>
					</div>
				</ImageCropper.UploadTrigger>
				<ImageCropper.Dialog>
					<ImageCropper.Cropper cropShape="round" />
					<ImageCropper.Controls>
						<ImageCropper.Cancel />
						<ImageCropper.Crop />
					</ImageCropper.Controls>
				</ImageCropper.Dialog>
			</ImageCropper.Root>
		</div>

		<!-- Inline editable name -->
		<div
			class={[
				'relative w-full rounded-container border border-surface-300-700 px-3.5 py-2 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': !isEditingName,
					'hover:bg-surface-200-800': !isEditingName,
					'hover:border-surface-200-800': !isEditingName
				}
			]}
		>
			<div class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
				<div class="flex w-full flex-col">
					<span class="text-xs text-surface-600-400">Name</span>
					<!-- View mode (collapses when editing) -->
					<div
						class={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditingName ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
							{ 'mt-1': !isEditingName }
						]}
						aria-hidden={isEditingName}
						inert={isEditingName}
					>
						<div class="overflow-hidden">
							<span class="truncate text-sm">{activeUser.name}</span>
						</div>
					</div>

					<!-- Edit mode (expands when editing) -->
					<div
						class={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditingName ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
							{ 'mt-1': isEditingName }
						]}
						aria-hidden={!isEditingName}
						inert={!isEditingName}
					>
						<div class="overflow-hidden">
							<form onsubmit={handleSubmit} class="flex w-full flex-col gap-3">
								<input bind:this={nameInputEl} type="text" class="input w-full" bind:value={name} />
								<div class="mb-1 flex gap-1.5">
									<button
										type="button"
										class="btn w-full preset-tonal btn-sm"
										onclick={() => {
											name = activeUser.name;
											isEditingName = false;
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn w-full preset-filled-primary-500 btn-sm"
										disabled={!name || name.trim() === '' || name.trim() === activeUser.name.trim()}
									>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
				<!-- Edit affordance and full-area overlay button in view mode -->
				{#if !isEditingName}
					<div>
						<span class="pointer-events-none btn-icon preset-filled-surface-50-950 p-2">
							<Pencil class="size-4" />
						</span>
					</div>
					<button
						class="absolute inset-0 h-full w-full"
						aria-label="Edit name"
						type="button"
						onclick={async () => {
							isEditingName = true;
							name = activeUser.name;
							await tick();
							nameInputEl?.focus();
							nameInputEl?.select();
						}}
					></button>
				{/if}
			</div>
		</div>
	{/if}
</div>
