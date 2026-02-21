import { Route } from "../+types";

export function action({ request }: Route.ActionArgs) {
  return Response.json("success");
}
