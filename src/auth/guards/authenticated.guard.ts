import { findUserById } from "@repositories/users";
import { APIResponse } from "@typesDef/api";
import { publicUserDTO } from "@typesDef/models/user";
import logger from "@utils/loggers";

export const isAuthenticated = async (
  jwtAccess: any,
  cookie: any,
): Promise<APIResponse<publicUserDTO>> => {
  if (!cookie.access_token) {
    console.log("@Error: No access token", cookie);
    return {
      success: false,
      message: "Unauthorized",
      errors: "No access token",
    };
  }

  const jwt = await jwtAccess.verify(cookie!.access_token.value);
  if (!jwt) {
    logger.error("@Error: Invalid access token", jwt);
    return {
      success: false,
      message: "Unauthorized",
      errors: "Invalid access token",
    };
  }

  const { userId } = jwt;
  if (!userId) {
    logger.error("@Error: Invalid access token", userId);
    return {
      success: false,
      message: "Unauthorized",
      errors: "Invalid access token",
    };
  }
  const user = await findUserById(Number(userId));

  if (!user) {
    logger.error("@Error: User not found", user);
    return {
      success: false,
      message: "Unauthorized",
      errors: "User not found",
    };
  }

  return {
    success: true,
    data: {
      username: user.username,
      email: user.email,
    },
  };
};
