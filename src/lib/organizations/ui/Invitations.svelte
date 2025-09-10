<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	// Primitives
	import * as Dialog from '../../primitives/ui/dialog';
	import { toast } from 'svelte-sonner';
	// Icons
	import { Search } from '@lucide/svelte';

	// API
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	const roles = useRoles();
	import { authClient } from '../../auth/api/auth-client';

	// Types
	type Role = typeof authClient.$Infer.Member.role;
	import type { FunctionReturnType } from 'convex/server';
	type InvitationListResponse = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;

	// Props
	let { initialData }: { initialData?: InvitationListResponse } = $props();
	// Queries
	const invitationListResponse = useQuery(
		api.organizations.invitations.queries.listInvitations,
		{},
		{ initialData }
	);
	const invitationList = $derived(invitationListResponse.data);

	// State
	let selectedInvitationId: string | null = $state(null);
	let searchQuery: string = $state('');
	let isDialogOpen: boolean = $state(false);

	/**
	 * Filter invitations based on search query and only show pending invitations
	 */
	const filteredInvitations = $derived.by(() => {
		if (!invitationList) return [];

		return invitationList
			.filter((invitation) => {
				// Only show pending invitations
				if (invitation.status !== 'pending') return false;

				if (!searchQuery) return true;

				return invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
			})
			.sort((a, b) => {
				// Sort by role (owner first, then admin, then member)
				const roleOrder: Record<Role, number> = {
					owner: 0,
					admin: 1,
					member: 2
				};

				// Primary sort by role
				const roleDiff = roleOrder[a.role as Role] - roleOrder[b.role as Role];
				if (roleDiff !== 0) return roleDiff;

				// Secondary sort by email
				return a.email.localeCompare(b.email);
			});
	});

	/**
	 * Handles revoking an invitation
	 */
	async function handleRevokeInvitation(): Promise<void> {
		if (!selectedInvitationId) return;

		const { error } = await authClient.organization.cancelInvitation({
			invitationId: selectedInvitationId
		});

		if (error?.message) {
			toast.error(error.message);
			return;
		} else {
			toast.success('Invitation revoked successfully');
			isDialogOpen = false;
		}
	}

	/**
	 * Handle search input change
	 */
	function handleSearchChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
	}
</script>

{#if !invitationList}
	<div>Loading invitations...</div>
{:else if filteredInvitations.length === 0 && !searchQuery}
	<div class="p-8 text-center text-surface-600-400">
		<p>No pending invitations.</p>
	</div>
{:else}
	<div class="flex h-full flex-col">
		<!-- Search Section - Fixed at top -->
		<div class="flex flex-shrink-0 items-center gap-3 py-4">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 flex items-center">
					<Search class="size-4 text-surface-400-600" />
				</div>
				<input
					type="text"
					class="w-hug input w-full !border-0 !border-transparent pl-6 text-sm"
					placeholder="Search invitations..."
					value={searchQuery}
					onchange={handleSearchChange}
				/>
			</div>
		</div>

		<!-- Table Section - Scrollable area -->
		<div class="min-h-0 flex-1">
			{#if filteredInvitations.length === 0 && searchQuery}
				<div class="p-8 text-center text-surface-600-400">
					<p>No invitations match your search.</p>
				</div>
			{:else}
				<div>
					<!-- Table container with controlled height and scroll -->
					<div
						class="max-h-[calc(90vh-12rem)] overflow-y-auto pb-12 sm:max-h-[calc(80vh-12rem)] md:max-h-[calc(70vh-12rem)]"
					>
						<table class="table w-full !table-fixed">
							<thead class="sticky top-0 z-20 border-b border-surface-300-700">
								<tr>
									<th class="w-64 truncate p-2 !pl-0 text-left text-xs text-surface-700-300">
										User
									</th>
									<th class="w-32 p-2 !pl-0 text-left text-xs text-surface-700-300"> Expires </th>
									<th class="hidden w-32 p-2 text-left text-xs text-surface-700-300 sm:table-cell">
										Role
									</th>
									{#if roles.hasOwnerOrAdminRole}
										<th class="w-20 p-2 text-right"></th>
									{/if}
								</tr>
							</thead>
							<tbody>
								{#each filteredInvitations as invitation (invitation.id)}
									<tr class="!border-t !border-surface-300-700">
										<!-- User -->
										<td class="!w-64 !max-w-64 !truncate !py-3 !pl-0">
											<span class="truncate font-medium">{invitation.email}</span>
										</td>
										<!-- Expires -->
										<td class="!w-64 !max-w-64 !truncate !py-3 !pl-0">
											<span class="truncate font-medium">
												{new Date(invitation.expiresAt).toLocaleDateString()}
											</span>
										</td>
										<!-- Role -->
										<td class="hidden !w-32 !text-surface-700-300 sm:table-cell">
											<div class="flex items-center">
												{#if invitation.role === 'owner'}
													<span
														class="badge h-6 border border-primary-200-800 preset-filled-primary-50-950 px-2"
													>
														Owner
													</span>
												{:else if invitation.role === 'admin'}
													<span
														class="badge h-6 border border-warning-200-800 preset-filled-warning-50-950 px-2"
													>
														Admin
													</span>
												{:else}
													<span
														class="badge h-6 border border-surface-400-600 preset-filled-surface-300-700 px-2"
													>
														Member
													</span>
												{/if}
											</div>
										</td>
										<!-- Actions -->
										<td class="!w-20">
											<div class="flex justify-end">
												{#if roles.hasOwnerOrAdminRole}
													<Dialog.Root bind:open={isDialogOpen}>
														<Dialog.Trigger
															class="btn preset-filled-surface-300-700 btn-sm"
															onclick={() => {
																selectedInvitationId = invitation.id;
																isDialogOpen = true;
															}}
														>
															Revoke
														</Dialog.Trigger>
														<Dialog.Content class="md:max-w-108">
															<Dialog.Header class="flex-shrink-0">
																<Dialog.Title>Revoke invitation</Dialog.Title>
															</Dialog.Header>
															<article class="flex-shrink-0 px-6">
																<p class="opacity-60">
																	Are you sure you want to revoke the invitation sent to
																	{invitation.email}?
																</p>
															</article>
															<Dialog.Footer class="w-full flex-shrink-0 p-6">
																<button
																	type="button"
																	class="btn preset-tonal"
																	onclick={() => (isDialogOpen = false)}
																>
																	Cancel
																</button>
																<button
																	type="button"
																	class="btn preset-filled-error-500"
																	onclick={handleRevokeInvitation}
																>
																	Confirm
																</button>
															</Dialog.Footer>
														</Dialog.Content>
													</Dialog.Root>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
