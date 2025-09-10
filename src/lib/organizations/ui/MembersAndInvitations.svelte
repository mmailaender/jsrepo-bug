<!--
	Installed from @auth/svelte@latest
-->

<script lang="ts">
	// Primitives
	import * as Tabs from '../../primitives/ui/tabs';
	import * as Dialog from '../../primitives/ui/dialog';
	import * as Drawer from '../../primitives/ui/drawer';
	// Icons
	import { Plus } from '@lucide/svelte';
	// Components
	import Members from '$lib/organizations/ui/Members.svelte';
	import Invitations from '$lib/organizations/ui/Invitations.svelte';
	import InviteMembers from '$lib/organizations/ui/InviteMembers.svelte';

	// API
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';

	// API Types
	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type InvitationListResponse = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization?: ActiveOrganizationResponse;
			invitationList?: InvitationListResponse;
		};
	} = $props();

	// Queries
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);
	const invitationListResponse = useQuery(
		api.organizations.invitations.queries.listInvitations,
		{},
		{ initialData: initialData?.invitationList }
	);

	// Derived data
	const activeOrganization = $derived(activeOrganizationResponse.data);
	const members = $derived(activeOrganization?.members);
	const invitationList = $derived(invitationListResponse.data);
	const roles = useRoles();
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// State
	let inviteMembersDialogOpen = $state(false);
	let inviteMembersDrawerOpen = $state(false);

	// Handlers
	function handleInviteMembersSuccess() {
		inviteMembersDialogOpen = false;
		inviteMembersDrawerOpen = false;
	}
</script>

<Tabs.Root value="members">
	<div
		class="flex w-full flex-row justify-between border-b border-surface-300-700 pb-6 align-middle"
	>
		<Tabs.List class="flex-1 md:flex-initial">
			<Tabs.Trigger value="members" class="flex-1 gap-2 md:flex-initial">
				Members
				<span class="badge size-6 rounded-full preset-filled-surface-300-700">
					{members && `${members.length}`}
				</span>
			</Tabs.Trigger>
			{#if isOwnerOrAdmin}
				<Tabs.Trigger value="invitations" class="flex-1 gap-2 md:flex-initial">
					Invitations
					<span class="badge size-6 rounded-full preset-filled-surface-300-700">
						{invitationList && `${invitationList.filter((i) => i.status === 'pending').length}`}
					</span>
				</Tabs.Trigger>
			{/if}
		</Tabs.List>
		{#if isOwnerOrAdmin}
			<Dialog.Root bind:open={inviteMembersDialogOpen}>
				<Dialog.Trigger
					class="btn hidden h-10 items-center gap-2 preset-filled-primary-500 text-sm md:flex"
				>
					<Plus class="size-5" />
					<span>Invite members</span>
				</Dialog.Trigger>
				<Dialog.Content class="max-w-108">
					<Dialog.Header>
						<Dialog.Title>Invite new members</Dialog.Title>
					</Dialog.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
			<Drawer.Root bind:open={inviteMembersDrawerOpen}>
				<Drawer.Trigger
					class="absolute right-4 bottom-4 z-10 btn h-10 preset-filled-primary-500 text-sm md:hidden"
				>
					<Plus class="size-5" /> Invite members
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Invite new members</Drawer.Title>
					</Drawer.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} />
					<Drawer.CloseX />
				</Drawer.Content>
			</Drawer.Root>
		{/if}
	</div>

	<Tabs.Content value="members">
		<Members />
	</Tabs.Content>

	{#if isOwnerOrAdmin}
		<Tabs.Content value="invitations">
			<Invitations />
		</Tabs.Content>
	{/if}
</Tabs.Root>
