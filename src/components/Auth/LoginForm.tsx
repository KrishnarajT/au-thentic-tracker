export default function LoginScreen() {
	return (
		<div className="min-h-screen grid place-items-center">
			<div className="space-y-4 text-center">
				<h1 className="text-2xl font-semibold">Authentic Tracker</h1>
				<p>Sign in to manage your gold portfolio.</p>
				<button onClick={() => auth.signinRedirect()} className="btn">
					Sign in with Authentik
				</button>
				<p className="text-sm text-muted-foreground">
					Forgot password? You’ll find it on the Authentik login page.
				</p>
			</div>
		</div>
	);
}
