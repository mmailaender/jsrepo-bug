/*
	Installed from @auth/svelte@0.0.3
*/

import { createAuthClient } from 'better-auth/svelte';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { emailOTPClient, organizationClient, magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [convexClient(), organizationClient(), emailOTPClient(), magicLinkClient()]
});
