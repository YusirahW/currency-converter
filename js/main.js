const el = e => document.querySelector(e);

// Initial Values
document.getElementById("viewValue").innerHTML = `00.00`;

idSymbolFrom = '';
idSymbolTo = '';

convert = () => {
	userConnection();

	let fromValue = document.querySelector('#fromCurrencyValue').value;
	let fromCurr = document.querySelector('#fromCurrency').value;
	let toCurr = document.querySelector('#toCurrency').value;

	const query = `${fromCurr}_${toCurr}`;
	const requestUrl = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=ultra`;

	fetch(requestUrl)
		.then(response => response.json())
		.then(responseValue => {
			let unitValue = responseValue[`${fromCurr}_${toCurr}`];
			let currencyConverted = fromValue * unitValue;
			document.getElementById("viewValue").innerHTML = `${idSymbolTo} ${currencyConverted.toFixed(2)}`;
		});

};
// API
fetch('https://free.currencyconverterapi.com/api/v5/countries')
	.then(response => response.json())
	.then(res => {
		let html = '';
		for (let country of Object.values(res.results)) {
			html += `<option id="${country.currencySymbol}" value="${country.currencyId}">${country.currencyName}</option>`;
		}
		el("#fromCurrency").insertAdjacentHTML('afterbegin', html);
		el("#toCurrency").insertAdjacentHTML('afterbegin', html);
	});

userConnection = () => {
	if (navigator.onLine) {

	} else {
		// Display an info toast with no title
		toastr.warning('You\'re currently offline, conversions require internet connectivity', 'Offline');
		toastr.options = {
			"closeButton": true,
			"positionClass": "toast-top-right",
			"showEasing": "swing",
			"showDuration": "3000"
		}
	}
};
// Service Worker registration
if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('./service-worker.js', {
			scope: './'
		})
		.then(registration => {
			console.log("Service Worker Registered", registration);
		})
		.catch(err => {
			console.log("Service Worker failed to Register", err);
		})
}

// IndexedDb initialization
const dbPromise = idb.open('currencyConverter', 3, (upgradeDb) => {
	switch (upgradeDb.oldVersion) {
		case 0:
			upgradeDb.createObjectStore('countries', {
				keyPath: 'currencyId'
			});
		case 1:
			let countriesStore = upgradeDb.transaction.objectStore('countries');
			countriesStore.createIndex('country', 'currencyName');
			countriesStore.createIndex('country-code', 'currencyId');
		case 2:
			upgradeDb.createObjectStore('conversionRates', {
				keyPath: 'query'
			});
			let ratesStore = upgradeDb.transaction.objectStore('conversionRates');
			ratesStore.createIndex('rates', 'query');
	}
});


document.addEventListener('DOMContentLoaded', () => {
	// Fetch Countries
	fetch('https://free.currencyconverterapi.com/api/v5/countries')
		.then(res => res.json())
		.then(res => {
			Object.values(res.results).forEach(country => {
				dbPromise.then(db => {
					const countries = db.transaction('countries', 'readwrite').objectStore('countries');
					countries.put(country);
				})
			});
			dbPromise.then(db => {
				const countries = db.transaction('countries', 'readwrite').objectStore('countries');
				const countriesIndex = countries.index('country');
				countriesIndex.getAll().then(currencies => {
					// fetchCountries(currencies);
				})
			})
		}).catch(() => {
		dbPromise.then(db => {
			const countries = db.transaction('countries').objectStore('countries');
			const countriesIndex = countries.index('country');
			countriesIndex.getAll().then(currencies => {
				// fetchCountries(currencies);
			})

		});
	});
});