/** Kunci sessionStorage: preloader cukup tampil sekali per sesi. */
export const PRELOADER_SEEN_KEY = "preloader-seen";

/** Skrip inline (dijalankan sebelum hidrasi): kunjungan ulang di sesi yang sama langsung melewati preloader. */
export const PRELOADER_SKIP_SCRIPT = `try{if(sessionStorage.getItem("${PRELOADER_SEEN_KEY}"))document.documentElement.classList.add("preloader-skip")}catch(e){}`;
