export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold">The Polyglot Hub</h1>
        <p className="mt-1 text-sm text-ink-soft">This journal is private. Enter the password to continue.</p>
      </header>

      <form action="/login/submit" method="POST" className="paper-card flex flex-col gap-3 rounded-lg p-5">
        <input type="hidden" name="from" value={from ?? "/"} />
        <input
          name="password"
          type="password"
          autoFocus
          required
          placeholder="Password"
          className="rounded border border-ink/20 bg-paper px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red">Incorrect password. Try again.</p>}
        <button
          type="submit"
          className="rounded bg-blue px-3 py-2 text-sm font-medium text-paper transition hover:opacity-90"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
