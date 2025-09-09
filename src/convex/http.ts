/*
	Installed from @auth/svelte@0.0.3
*/

import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { betterAuthComponent } from './auth';
import { createAuth } from '../lib/auth/api/auth';
import { resend } from './email';

const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth);

http.route({
	path: '/resend-webhook',
	method: 'POST',
	handler: httpAction(async (ctx, req) => {
		return await resend.handleResendEventWebhook(ctx, req);
	})
});

export default http;
