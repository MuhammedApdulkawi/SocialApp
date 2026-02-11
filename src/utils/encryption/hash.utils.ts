import { compareSync, hashSync } from "bcrypt";

export const generateHash = (
  plainText: string,
  saltNumber: number = parseInt(process.env.SALT_ROUNDS as string),
): string => {
  return hashSync(plainText, saltNumber);
};

export const compareHash = (plainText: string, hash: string): boolean => {
  return compareSync(plainText, hash);
};
