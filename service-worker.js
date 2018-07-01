// Set a name for the current cache
const cacheName = 'v1';

// Default files to always cache
const cacheFiles = [
	'./',
	'./index.html',
	'./styles/index.css',
	'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
	'./js/main.js',
	'./js/idb.js',
	'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js',
];


self.addEventListener('install', (event) => {
	console.log('ServiceWorker Installed');
	event.waitUntil(
		caches.open(cacheName).then( (cache) => {
			console.log('ServiceWorker Caching cacheFiles');
			return cache.addAll(cacheFiles);
		})
	);
});


self.addEventListener('activate', (event) => {
	console.log('[ServiceWorker] Activated');
	event.waitUntil(
		// Get all the cache keys (cacheName)
		caches.keys().then( (cacheNames) => {
			return Promise.all(cacheNames.map( (thisCacheName) => {

				// If a cached item is saved under a previous cacheName
				if (thisCacheName !== cacheName) {

					// Delete that cached file
					console.log('ServiceWorker Removing Cached Files from Cache - ', thisCacheName);
					return caches.delete(thisCacheName);
				}
			}));
		})
	);
});


self.addEventListener('fetch', (event) => {
	console.log('ServiceWorker Fetch', event.request.url);
	// event.respondWidth Responds to the fetch event
	event.respondWith(
		// Check in cache for the request being made
		caches.match(event.request)
			.then( (response) => {
				// If the request is in the cache
				if (response) {
					console.log("ServiceWorker Found in Cache", event.request.url, response);
					// Return the cached version
					return response;
				}
				// If the request is NOT in the cache, fetch and cache
				const requestClone = event.request.clone();
				return fetch(requestClone)
					.then( (response) => {
						if (!response) {
							console.log("ServiceWorker No response from fetch");
							return response;
						}
						const responseClone = response.clone();
						caches.open(cacheName).then( (cache) => {
							cache.put(event.request, responseClone);
							console.log('ServiceWorker New Data Cached', event.request.url);
							return response;
						});
					})
					.catch( (err) => {
						console.log('ServiceWorker Error Fetching & Caching New Data', err);
					});
			})
	);
});