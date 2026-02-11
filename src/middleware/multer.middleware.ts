import multer from "multer";

export const Multer = () => {
  return multer({ storage: multer.diskStorage({}) });
};
