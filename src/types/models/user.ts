export interface UserDTO {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  cookie?: string;
}

export interface SignInUserDto {
  email: string;
  password: string;
}

export interface publicUserDTO {
  username: string;
  email: string;
  id?: string;
}

export interface NewUserConfig extends SignInUserDto {
  username: string;
}
