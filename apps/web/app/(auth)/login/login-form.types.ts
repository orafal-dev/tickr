import type { z } from "zod"

import { loginFormSchema } from "./login-form.schema"

export type LoginFormValues = z.infer<typeof loginFormSchema>
