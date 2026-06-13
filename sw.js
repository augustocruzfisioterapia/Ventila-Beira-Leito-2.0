// ==================== SERVICE WORKER ====================
// Ventila Beira-Leito - Progressive Web App
// Versão: v13 (atualize este número sempre que modificar o app)

const CACHE_NAME = "ventila-beira-leito-v19";

// Arquivos essenciais para o funcionamento offline do app
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./site.webmanifest",
  "./favicon.ico",
  "./privacy-policy.html",
  "./icons/ventila-v2-96.png",
  "./icons/ventila-v2-180.png",
  "./icons/ventila-v2-192.png",
  "./icons/ventila-v2-512.png"
];

// INSTALAÇÃO - Cacheia os arquivos e força ativação imediata
self.addEventListener("install", event => {
  console.log("[Service Worker] Instalando versão:", CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[Service Worker] Cacheando arquivos...");
      return cache.addAll(FILES_TO_CACHE);
    }).catch(err => {
      console.error("[Service Worker] Erro ao cachear arquivos:", err);
    })
  );
  // Força o novo Service Worker a ativar imediatamente
  self.skipWaiting();
});

// ATIVAÇÃO - Limpa caches antigos e assume controle das páginas
self.addEventListener("activate", event => {
  console.log("[Service Worker] Ativando versão:", CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("[Service Worker] Removendo cache antigo:", key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log("[Service Worker] Pronto para controlar as páginas");
      // Assume o controle imediato de todas as páginas abertas
      return self.clients.claim();
    })
  );
});

// INTERCEPTAÇÃO DE REQUISIÇÕES - Busca no cache primeiro, depois na rede
self.addEventListener("fetch", event => {
  // Ignora requisições para analytics e extensões
  if (event.request.url.includes('google-analytics') || 
      event.request.url.includes('chrome-extension')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Se encontrou no cache, retorna o cache
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Se não encontrou no cache, busca na rede
      return fetch(event.request).then(networkResponse => {
        // Não cacheia requisições de API ou dados de usuário
        if (event.request.method !== 'GET') {
          return networkResponse;
        }
        
        // Opcional: cacheia novas requisições em segundo plano
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Fallback para quando estiver offline e não tiver cache
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('Offline - Conteúdo não disponível', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// MENSAGENS - Permite comunicação entre o app e o Service Worker
self.addEventListener("message", event => {
  if (event.data && event.data.action === "skipWaiting") {
    console.log("[Service Worker] Recebido comando para pular espera");
    self.skipWaiting();
  }
});
