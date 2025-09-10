<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	// Svelte
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';

	// API Types
	import type { FunctionReturnType } from 'convex/server';

	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	const client = useConvexClient();
	const roles = useRoles();
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// UI Components
	// Icons
	import { Building2, Pencil } from '@lucide/svelte';

	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '../../primitives/ui/avatar';
	import * as ImageCropper from '../../primitives/ui/image-cropper';
	import { getFileFromUrl } from '../../primitives/ui/image-cropper';

	// Utils
	import { optimizeImage } from '../../primitives/utils/optimizeImage';

	// Props
	let {
		initialData
	}: {
		initialData?: {
			user?: UserResponse;
			activeOrganization?: ActiveOrganizationResponse;
		};
	} = $props();

	// Queries
	const userResponse = useQuery(
		api.users.queries.getActiveUser,
		{},
		{ initialData: initialData?.user }
	);
	const organizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);

	// Avatar State
	let imageLoadingStatus: 'loading' | 'loaded' | 'error' = $state('loaded');
	let isUploading: boolean = $state(false);
	let logoKey: number = $state(0); // Force re-render when logo changes
	let cropSrc: string = $state('');

	// Inline name editing state
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let nameInputEl: HTMLInputElement | null = $state(null);

	// Inline slug editing state
	let isEditingSlug: boolean = $state(false);
	let slug: string = $state('');
	let slugInputEl: HTMLInputElement | null = $state(null);

	// Derived data
	const user = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);

	// Initialize state when organization data is available
	$effect(() => {
		if (activeOrganization) {
			if (!isEditingName) {
				name = activeOrganization.name;
			}
			if (!isEditingSlug) {
				slug = activeOrganization.slug || '';
			}
		}
	});

	// Keep crop preview in sync with org logo
	$effect(() => {
		if (activeOrganization?.logo) {
			cropSrc = activeOrganization.logo;
		}
	});

	// Handlers

	async function handleCropped(url: string): Promise<void> {
		if (!activeOrganization) return;
		try {
			isUploading = true;
			const croppedFile = await getFileFromUrl(url, 'logo.png');
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

			const { storageId } = await response.json();
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				logoId: storageId
			});

			imageLoadingStatus = 'loading';
			logoKey += 1;
			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update logo: ${message}`);
			imageLoadingStatus = 'error';
		} finally {
			isUploading = false;
		}
	}

	async function handleNameSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();
		if (!activeOrganization) return;

		try {
			const trimmed = name.trim();
			if (!trimmed || trimmed === activeOrganization.name.trim()) {
				isEditingName = false;
				return;
			}
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				name: trimmed
			});
			isEditingName = false;
			toast.success('Organization name updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		}
	}

	async function handleSlugSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();
		if (!activeOrganization) return;

		try {
			const trimmed = slug.trim();
			const currentSlug = activeOrganization.slug || '';
			if (trimmed === '' || trimmed === currentSlug) {
				isEditingSlug = false;
				return;
			}

			// Update slug
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				slug: trimmed
			});

			// If current URL contains the old slug, replace it with the new slug
			const currentPathname = page.url.pathname;
			const urlContainsCurrentSlug =
				currentSlug &&
				(currentPathname.includes(`/${currentSlug}/`) ||
					currentPathname.endsWith(`/${currentSlug}`));

			if (urlContainsCurrentSlug) {
				const newPathname = currentPathname.replace(
					new RegExp(`/${currentSlug}(?=/|$)`, 'g'),
					`/${trimmed}`
				);
				await goto(newPathname, { replaceState: true });
			}

			isEditingSlug = false;
			toast.success('Organization slug updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		}
	}
</script>

{#if user && activeOrganization}
	<div class="flex w-full flex-col items-start gap-6">
		<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={handleCropped}>
			<ImageCropper.UploadTrigger>
				<div class="relative cursor-pointer rounded-container transition-all duration-200">
					{#key logoKey}
						<Avatar.Root
							class="size-20 rounded-container"
							onStatusChange={(e) => (imageLoadingStatus = e.status)}
						>
							<Avatar.Image
								src={activeOrganization.logo}
								alt={activeOrganization.name || 'Organization'}
							/>
							<Avatar.Fallback
								class="rounded-container bg-surface-300-700 duration-150 ease-in-out hover:bg-surface-400-600/80"
							>
								<Building2 class="size-10 text-surface-700-300" />
							</Avatar.Fallback>
						</Avatar.Root>
					{/key}

					{#if isUploading || imageLoadingStatus === 'loading'}
						<div
							class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-container bg-surface-50-950"
						>
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"
							></div>
						</div>
					{/if}

					<div
						class="absolute -right-1.5 -bottom-1.5 badge-icon size-3 rounded-full preset-filled-surface-300-700 ring-4 ring-surface-50-950 dark:ring-surface-100-900"
					>
						<Pencil class="size-4" />
					</div>
				</div>
			</ImageCropper.UploadTrigger>
			<ImageCropper.Dialog>
				<ImageCropper.Cropper cropShape="rect" />
				<ImageCropper.Controls>
					<ImageCropper.Cancel />
					<ImageCropper.Crop />
				</ImageCropper.Controls>
			</ImageCropper.Dialog>
		</ImageCropper.Root>

		<!-- Inline editable organization name -->
		<div class="flex w-full flex-col gap-3">
			<div
				class={[
					'relative w-full rounded-container border border-surface-300-700 px-3.5 py-2 transition-all duration-200 ease-in-out',
					{
						'cursor-pointer': isOwnerOrAdmin && !isEditingName,
						'hover:bg-surface-200-800': isOwnerOrAdmin && !isEditingName,
						'hover:border-surface-200-800': isOwnerOrAdmin && !isEditingName
					}
				]}
			>
				<div
					class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out"
				>
					<div class="flex w-full flex-col gap-0">
						<span class="text-xs text-surface-600-400">Organization name</span>
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
								<span class=" truncate text-sm">{activeOrganization.name}</span>
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
								<form onsubmit={handleNameSubmit} class="flex w-full flex-col gap-3">
									<input
										bind:this={nameInputEl}
										type="text"
										class="input w-full"
										bind:value={name}
									/>
									<div class="mb-1 flex gap-1.5">
										<button
											type="button"
											class="btn w-full preset-tonal btn-sm"
											onclick={() => {
												name = activeOrganization.name;
												isEditingName = false;
											}}
										>
											Cancel
										</button>
										<button
											type="submit"
											class="btn w-full preset-filled-primary-500 btn-sm"
											disabled={!name ||
												name.trim() === '' ||
												name.trim() === activeOrganization.name.trim()}
										>
											Save
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
					<!-- Edit affordance and full-area overlay button in view mode -->
					{#if isOwnerOrAdmin && !isEditingName}
						<div class="shrink-0">
							<span class="pointer-events-none btn-icon preset-filled-surface-50-950 p-2">
								<Pencil class="size-4" />
							</span>
						</div>
						<button
							class="absolute inset-0 h-full w-full"
							aria-label="Edit organization name"
							type="button"
							onclick={async () => {
								isEditingName = true;
								name = activeOrganization.name;
								await tick();
								nameInputEl?.focus();
								nameInputEl?.select();
							}}
						></button>
					{/if}
				</div>
			</div>

			<!-- Inline editable organization slug -->
			<div
				class={[
					'relative w-full rounded-container border border-surface-300-700 px-3.5 py-2 transition-all duration-200 ease-in-out',
					{
						'cursor-pointer': isOwnerOrAdmin && !isEditingSlug,
						'hover:bg-surface-200-800': isOwnerOrAdmin && !isEditingSlug,
						'hover:border-surface-200-800': isOwnerOrAdmin && !isEditingSlug
					}
				]}
			>
				<div
					class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out"
				>
					<div class="flex w-full flex-col gap-0">
						<span class="text-xs text-surface-600-400">Slug</span>
						<!-- View mode (collapses when editing) -->
						<div
							class={[
								'grid transition-[grid-template-rows] duration-200 ease-in-out',
								isEditingSlug ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
								{ 'mt-1': !isEditingSlug }
							]}
							aria-hidden={isEditingSlug}
							inert={isEditingSlug}
						>
							<div class="overflow-hidden">
								<span class=" truncate text-sm">{activeOrganization.slug}</span>
							</div>
						</div>

						<!-- Edit mode (expands when editing) -->
						<div
							class={[
								'grid transition-[grid-template-rows] duration-200 ease-in-out',
								isEditingSlug ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
								{ 'mt-1': isEditingSlug }
							]}
							aria-hidden={!isEditingSlug}
							inert={!isEditingSlug}
						>
							<div class="overflow-hidden">
								<form onsubmit={handleSlugSubmit} class="flex w-full flex-col gap-3">
									<input
										bind:this={slugInputEl}
										type="text"
										class="input w-full"
										bind:value={slug}
									/>
									<div class="mb-1 flex gap-1.5">
										<button
											type="button"
											class="btn w-full preset-tonal btn-sm"
											onclick={() => {
												slug = activeOrganization.slug || '';
												isEditingSlug = false;
											}}
										>
											Cancel
										</button>
										<button
											type="submit"
											class="btn w-full preset-filled-primary-500 btn-sm"
											disabled={!slug ||
												slug.trim() === '' ||
												slug.trim() === (activeOrganization.slug || '').trim()}
										>
											Save
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
					{#if isOwnerOrAdmin && !isEditingSlug}
						<div class="shrink-0">
							<span class="pointer-events-none btn-icon preset-filled-surface-50-950 p-2">
								<Pencil class="size-4" />
							</span>
						</div>
						<button
							class="absolute inset-0 h-full w-full"
							aria-label="Edit organization slug"
							type="button"
							onclick={async () => {
								isEditingSlug = true;
								slug = activeOrganization.slug || '';
								await tick();
								slugInputEl?.focus();
								slugInputEl?.select();
							}}
						></button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
