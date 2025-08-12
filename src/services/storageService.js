import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadAvatar(file, uid) {
  const path = `avatars/${uid}.jpg`;
  const sref = ref(storage, path);
  const buf = await file.arrayBuffer();
  await uploadBytes(sref, new Uint8Array(buf), { contentType: file.type || "image/jpeg" });
  return await getDownloadURL(sref);
}
