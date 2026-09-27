import { useEffect } from "react";
import { storeArtUrls } from "../data/store-art";
import { preloadImages } from "./preload-images";

/** Warms the store's ingredient art so shelf flips never wait on images. */
export function usePreloadStoreArt(): void {
  useEffect(() => {
    preloadImages(storeArtUrls());
  }, []);
}
