chrome.action.onClicked.addListener((tab) => {
  // Lista de URLs predeterminadas
  const urls = [
    "https://www.carrefour.com.ar/aceite-de-girasol-natura-15-l/p",
    "https://www.carrefour.com.ar/aceite-de-girasol-canuelas-15-l/p",
    "https://www.carrefour.com.ar/vinagre-de-alcohol-menoyo-1-l/p",
    "https://www.carrefour.com.ar/aceite-de-girasol-canuelas-900-cc/p"
  ];

  // Procesar cada URL
  urls.forEach(url => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extraerDatos,
      args: [url]
    });
  });
});

function extraerDatos(url) {
  console.log(`🔎 Procesando: ${url}`);
  
  // Aquí el código original para extraer los datos
  const template = document.querySelector('template[data-type="json"][data-varname="__STATE__"]');
  if (template) {
    const jsonString = template.innerHTML;
    const stateData = JSON.parse(jsonString);

    // Intentamos encontrar la clave con los datos del producto
    const productKey = Object.keys(stateData).find(key => 
      stateData[key].__typename === 'Product'
    );

    if (productKey) {
      const productData = stateData[productKey];
      const productName = productData.productName;
      const productId = productData.productId;
      const cacheId = productData.cacheId;

      // Obtenemos la imagen y el precio
      const itemData = productData.items[0];
      const imageUrl = itemData.images[0]?.imageUrl || "No image";
      const highPrice = itemData.sellers[0]?.commertialOffer?.Price || "No price";

      // Enviamos los datos al popup
      chrome.storage.local.set({
        productName,
        highPrice,
        imageUrl,
        productId,
        cacheId
      });

      alert(`Datos extraídos:
        Nombre: ${productName}
        Precio: ${highPrice}
        Imagen: ${imageUrl}
        ID del Producto: ${productId}
        Cache ID: ${cacheId}`);
    } else {
      alert("No se pudo encontrar el producto.");
    }
  } else {
    alert("No se encontró el JSON __STATE__ en la página.");
  }
}
