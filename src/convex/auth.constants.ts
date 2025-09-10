/*
	Installed from @auth/svelte@0.0.3
*/

export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		github: false,
		password: true
	},

	organizations: true,
	terms: '#',
	privacy: '#'
};

export type AuthConstants = {
	providers: {
		github?: boolean;
		google?: boolean;
		facebook?: boolean;
		apple?: boolean;
		microsoft?: boolean;
		keypass?: boolean;
		password?: boolean;
		emailOTP?: boolean;
		magicLink?: boolean;
	};
	organizations?: boolean;
	terms?: string;
	privacy?: string;
	validateEmails?: boolean;
};

