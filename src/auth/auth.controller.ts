import { isAuthenticated } from "@auth/guards/authenticated.guard";
import { registerUser, validateUser } from "@repositories/users";
import { APIResponse } from "@typesDef/api";
import { NewUserConfig, publicUserDTO, UserDTO } from "@typesDef/models/user";
import { SignInUserDto } from "@typesDef/user";
import { createElysia } from "@utils/createElysia";

import { CookieOptions } from "./guards/setup.jwt";

export const auth = createElysia({ prefix: "/auth" })
  .onBeforeHandle(({ set }) => {
    set.headers["content-type"] = "application/json; charset=utf-8";
  })
  .post(
    "/login",
    async ({
      body: data,
      jwtAccess,
      jwtRefresh,
      cookie,
    }): Promise<APIResponse<publicUserDTO>> => {
      const user: UserDTO = await validateUser(data as SignInUserDto);

      cookie.access_token.set({
        value: await jwtAccess.sign({
          userId: user.id?.toString(),
        }),
        ...CookieOptions.accessToken,
      });

      cookie.refresh_token.set({
        value: await jwtRefresh.sign({
          userId: user.id?.toString(),
        }),
        ...CookieOptions.refreshToken,
      });

      return {
        success: true,
        data: {
          email: user.email,
          username: user.username,
        },
      };
    },
  )
  .post(
    "/register",
    async ({
      body,
      jwtAccess,
      jwtRefresh,
      cookie,
    }): Promise<APIResponse<publicUserDTO>> => {
      if (!body) throw new Error("Data is required");

      const user: UserDTO = await registerUser(body as NewUserConfig);

      cookie.access_token.set({
        value: await jwtAccess.sign({
          userId: user.id?.toString(),
        }),
        ...CookieOptions.accessToken,
      });

      cookie.refresh_token.set({
        value: await jwtRefresh.sign({
          userId: user.id?.toString(),
        }),
        ...CookieOptions.refreshToken,
      });

      return {
        success: true,
        data: {
          username: user.username,
          email: user.email,
        },
      };
    },
  )
  .post("/logout", ({ cookie }): APIResponse => {
    delete cookie.access_token;
    delete cookie.refresh_token;
    return {
      success: true,
      data: null,
    };
  })
  .get("/me", async ({ cookie, jwtAccess, set }) => {
    const isAuth = await isAuthenticated(jwtAccess, cookie);
    if (!isAuth.success) {
      set.status = 401;
      throw new Error("Unauthorized", {
        cause: isAuth.message,
      });
    }
    return isAuth.data;
  });
