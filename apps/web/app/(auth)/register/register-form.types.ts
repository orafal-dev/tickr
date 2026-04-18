import type { z } from "zod";

import { registerFormSchema } from "./register-form.schema";

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
