/*
	Installed from @auth/svelte@latest
*/

// API
import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';

// Types
import type { FunctionReturnType } from 'convex/server';
import type { Id } from '$convex/_generated/dataModel';
type Role = FunctionReturnType<typeof api.organizations.queries.getOrganizationRole>;

export function useRoles(args: { orgId?: Id<'organizations'>; initialData?: Role } = {}) {
	const role = useQuery(
		api.organizations.queries.getOrganizationRole,
		{ organizationId: args.orgId },
		{ initialData: args.initialData }
	);

	return {
		get hasOwnerRole() {
			return role.data === 'owner';
		},
		get hasAdminRole() {
			return role.data === 'admin';
		},
		get hasOwnerOrAdminRole() {
			return ['owner', 'admin'].includes(role.data ?? '');
		},
		get isMember() {
			return role.data != null;
		}
	};
}
