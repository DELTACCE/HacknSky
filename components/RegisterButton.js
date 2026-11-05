import { EVENT } from "@/lib/config";

// One place decides where "Register" goes: an external registration page when
// EVENT.registerUrl is set, otherwise the in-page form (#register).
export default function RegisterButton({
  className = "btn btn-dark",
  children = "Register Now",
  ...rest
}) {
  const external = Boolean(EVENT.registerUrl);
  return (
    <a
      href={external ? EVENT.registerUrl : "#register"}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
