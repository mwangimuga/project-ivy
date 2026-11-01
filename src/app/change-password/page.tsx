export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ChangePasswordForm from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={null}>
      <ChangePasswordForm />
    </Suspense>
  );
}
