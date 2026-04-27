import Button from "@/components/ui/button";

export default function AuthRequiredPanel({
  title,
  description,
  cta = "Login",
}) {
  return (
    <div className="panel-strong mx-auto max-w-3xl p-8 text-center">
      <p className="eyebrow">Authentication Required</p>
      <h1 className="page-title mt-2">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground)]/76">
        {description}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button href="/login" size="lg">
          {cta}
        </Button>
        <Button href="/signup" variant="outline" size="lg">
          Create Account
        </Button>
      </div>
    </div>
  );
}
