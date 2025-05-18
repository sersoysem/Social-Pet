import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/FireBaseConfig";

export const GetFavList = async (email) => {
  try {
    const ref = doc(db, "UserFavPet", email); // koleksiyon: UserFavPet, doküman: mail
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return { favorites: Array.isArray(data.favorites) ? data.favorites : [] };
    } else {
      // Yoksa dokümanı oluştur (boş favorilerle) ve [] dön
      await setDoc(ref, { favorites: [] });
      return { favorites: [] };
    }
  } catch (e) {
    // Hata varsa da boş array dön
    return { favorites: [] };
  }
};


export const UpdateFav = async (email, favorites) => {
  const docRef = doc(db, 'UserFavPet', email);
  try {
    await updateDoc(docRef, {
      favorites: Array.isArray(favorites) ? favorites : []
    });
  } catch (e) {
    console.error("Favori güncelleme hatası (UpdateFav):", e);
  }
};

export default {
  GetFavList,
  UpdateFav
}
