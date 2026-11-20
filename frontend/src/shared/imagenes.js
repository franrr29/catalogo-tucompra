// pide a Cloudinary una version liviana de la imagen (calidad y formato automaticos)
export function optimizarUrl(url, ancho = 400) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/q_auto,f_auto,w_${ancho}/`);
}
