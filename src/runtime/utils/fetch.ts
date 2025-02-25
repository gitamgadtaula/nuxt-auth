import { resolveApiUrlPath } from "./url.js";
import { ERROR_PREFIX } from "./logger.js";
import { useRuntimeConfig } from "#imports";
import { callWithNuxt } from "#app/nuxt";
export async function _fetch(nuxt, path, fetchOptions) {
  const runtimeConfigOrPromise = callWithNuxt(nuxt, useRuntimeConfig);
  const runtimeConfig = "public" in runtimeConfigOrPromise ? runtimeConfigOrPromise : await runtimeConfigOrPromise;
  const joinedPath = resolveApiUrlPath(path, runtimeConfig);
  if (runtimeConfig.public.auth.disableInternalRouting === false) {
    const currentPath = nuxt.ssrContext?.event?.path;
    if (currentPath?.startsWith(joinedPath)) {
      console.error(`${ERROR_PREFIX} Recursion detected at ${joinedPath}. Have you set the correct \`auth.baseURL\`?`);
      throw new FetchConfigurationError("Server configuration error");
    }
  }
  const newOptions =
  {
    ...fetchOptions,
    credentials:'include'
  }
  try {
    console.log('fetch options',{joinedPath,newOptions})
    return $fetch(joinedPath, newOptions);
  } catch (error) {
    let errorMessage = `${ERROR_PREFIX} Error while requesting ${joinedPath}.`;
    if (runtimeConfig.public.auth.provider.type === "authjs") {
      errorMessage += " Have you added the authentication handler server-endpoint `[...].ts`? Have you added the authentication handler in a non-default location (default is `~/server/api/auth/[...].ts`) and not updated the module-setting `auth.basePath`?";
    }
    errorMessage += " Error is:";
    console.error(errorMessage);
    console.error(error);
    throw new FetchConfigurationError(
      "Runtime error, check the console logs to debug, open an issue at https://github.com/sidebase/nuxt-auth/issues/new/choose if you continue to have this problem"
    );
  }
}
export class FetchConfigurationError extends Error {
}
