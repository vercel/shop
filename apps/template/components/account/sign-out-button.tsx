import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action="/account/logout?return_to=/" method="post">
      <Button className="w-full" size="sm" type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  );
}
