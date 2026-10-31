/*
 * Mode démo de Billed.
 * L’API du projet (http://localhost:5678) est simulée dans le navigateur :
 * comptes, notes de frais et justificatifs restent dans le localStorage du
 * visiteur. Toutes les données de départ sont fictives ; les justificatifs
 * sont générés localement (aucun fichier externe).
 */
(function () {
  'use strict';

  var API_URL = /^http:\/\/localhost:5678(\/.*)?$/;
  var STORE_KEY = 'billed_demo_store_v1';
  var BANNER_KEY = 'billed_demo_banner';
  var ROOT = new URL('./', document.currentScript.src).href;
  var RESPONSE_DELAY = 150;
  var ACCOUNTS = {
    employee: { type: 'Employee', name: 'employee', email: 'employee@test.tld', password: 'employee' },
    admin: { type: 'Admin', name: 'admin', email: 'admin@test.tld', password: 'admin' }
  };

  var nativeFetch = window.fetch.bind(window);
  var store = null;

  /* ---------- Outils ---------- */

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveStore() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (error) {
      /* Stockage plein ou bloqué : les données restent en mémoire pour la session. */
    }
  }

  function randomId() {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var id = '';
    for (var i = 0; i < 20; i += 1) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  function reply(status, payload) {
    return { status: status, payload: payload };
  }

  function userFromRequest(init) {
    var headers = (init && init.headers) || {};
    var auth = headers.Authorization || headers.authorization || '';
    var match = /^Bearer demo\.([^.]+)\.(Employee|Admin)$/.exec(auth);
    if (!match) {
      return null;
    }
    try {
      return { email: window.atob(match[1]), type: match[2] };
    } catch (error) {
      return null;
    }
  }

  /* ---------- Justificatifs générés ---------- */

  function receiptImage(bill) {
    var canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 480;
    var context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 360, 480);
    context.strokeStyle = '#d9dee8';
    context.strokeRect(10, 10, 340, 460);
    context.fillStyle = '#0e5ae5';
    context.fillRect(10, 10, 340, 54);
    context.fillStyle = '#ffffff';
    context.font = 'bold 20px Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText('JUSTIFICATIF FICTIF', 180, 44);
    context.fillStyle = '#1b2430';
    context.textAlign = 'left';
    context.font = 'bold 18px Arial, sans-serif';
    context.fillText(String(bill.name).slice(0, 26), 30, 110);
    context.font = '15px Arial, sans-serif';
    context.fillStyle = '#4b5565';
    context.fillText(String(bill.type), 30, 138);
    context.fillText('Date : ' + bill.date, 30, 164);
    context.strokeStyle = '#e3e7ee';
    context.beginPath();
    context.moveTo(30, 190);
    context.lineTo(330, 190);
    context.stroke();
    var lines = [['Montant HT', Math.round(Number(bill.amount) * 0.8 * 100) / 100 + ' €'], ['TVA 20 %', Math.round(Number(bill.amount) * 0.2 * 100) / 100 + ' €']];
    lines.forEach(function (line, index) {
      context.fillStyle = '#4b5565';
      context.textAlign = 'left';
      context.fillText(line[0], 30, 222 + index * 28);
      context.textAlign = 'right';
      context.fillText(line[1], 330, 222 + index * 28);
    });
    context.fillStyle = '#1b2430';
    context.font = 'bold 22px Arial, sans-serif';
    context.textAlign = 'left';
    context.fillText('Total TTC', 30, 320);
    context.textAlign = 'right';
    context.fillText(bill.amount + ' €', 330, 320);
    context.fillStyle = '#9aa3b2';
    context.font = '13px Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText('Document généré pour la démonstration', 180, 440);
    return canvas.toDataURL('image/jpeg', 0.6);
  }

  function fileToImage(file) {
    return new Promise(function (resolve) {
      if (!file || !/^image\//.test(file.type || '')) {
        resolve(null);
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { resolve(null); };
      reader.onload = function () {
        var image = new Image();
        image.onerror = function () { resolve(null); };
        image.onload = function () {
          var ratio = Math.min(1, 480 / Math.max(image.width, image.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Données de départ ---------- */

  function seedBills() {
    var rows = [
      ['employee@test.tld', 'Transports', 'Train Vannes-Paris', 94, '2026-03-12', 'accepted', 'Validé.', 'Déplacement client'],
      ['employee@test.tld', 'Restaurants et bars', 'Déjeuner avec un client', 42, '2026-04-02', 'pending', '', 'Rendez-vous commercial'],
      ['employee@test.tld', 'Hôtel et logement', 'Hôtel séminaire Lyon', 312, '2026-05-19', 'accepted', 'OK, séminaire confirmé.', 'Séminaire annuel'],
      ['employee@test.tld', 'Services en ligne', 'Abonnement outil de design', 29, '2026-06-03', 'refused', 'Justificatif illisible.', 'Licence mensuelle'],
      ['employee@test.tld', 'Fournitures de bureau', 'Cartouches d’encre', 58, '2026-07-08', 'pending', '', 'Imprimante du bureau'],
      ['marie.dupont@billed.com', 'IT et électronique', 'Clavier ergonomique', 89, '2026-07-21', 'pending', '', 'Poste de travail'],
      ['lucas.martin@billed.com', 'Transports', 'Taxi aéroport', 47, '2026-07-24', 'pending', '', 'Retour de mission'],
      ['sarah.bernard@billed.com', 'Restaurants et bars', 'Dîner d’équipe', 156, '2026-08-02', 'pending', '', 'Fin de projet'],
      ['thomas.petit@billed.com', 'Hôtel et logement', 'Nuit d’hôtel Rennes', 120, '2026-06-14', 'accepted', 'Validé.', 'Salon professionnel'],
      ['marie.dupont@billed.com', 'Equipement et matériel', 'Écran 27 pouces', 249, '2026-05-06', 'accepted', 'Validé.', 'Équipement du bureau'],
      ['lucas.martin@billed.com', 'Services en ligne', 'Licence logiciel', 99, '2026-04-18', 'refused', 'Hors budget.', 'Outil de gestion'],
      ['sarah.bernard@billed.com', 'Fournitures de bureau', 'Papier et classeurs', 34, '2026-03-27', 'refused', 'Doublon avec une autre note.', 'Réassort']
    ];
    return rows.map(function (row) {
      var bill = {
        id: randomId(), email: row[0], type: row[1], name: row[2], amount: row[3], date: row[4], status: row[5],
        commentAdmin: row[6], commentary: row[7], vat: String(Math.round(row[3] * 0.2)), pct: 20,
        fileName: 'justificatif-' + row[4] + '.jpg'
      };
      bill.fileUrl = receiptImage(bill);
      return bill;
    });
  }

  function ensureStore() {
    if (store) {
      return store;
    }
    store = readStore();
    if (!store) {
      store = { users: [ACCOUNTS.employee, ACCOUNTS.admin], bills: seedBills() };
      saveStore();
    }
    return store;
  }

  /* ---------- Routes de l’API ---------- */

  function login(body) {
    var data = {};
    try { data = JSON.parse(body); } catch (error) { /* corps invalide */ }
    var user = ensureStore().users.filter(function (item) { return item.email === data.email; })[0];
    if (!user) {
      return Promise.resolve(reply(404, { message: 'Utilisateur introuvable' }));
    }
    if (user.password !== data.password) {
      return Promise.resolve(reply(401, { message: 'Mot de passe incorrect' }));
    }
    return Promise.resolve(reply(200, { jwt: 'demo.' + window.btoa(user.email) + '.' + user.type }));
  }

  function createUser(body) {
    var data = {};
    try { data = JSON.parse(body); } catch (error) { /* corps invalide */ }
    if (!data.email) {
      return Promise.resolve(reply(400, { message: 'Adresse e-mail manquante' }));
    }
    if (ensureStore().users.some(function (item) { return item.email === data.email; })) {
      return Promise.resolve(reply(409, { message: 'Cet utilisateur existe déjà' }));
    }
    store.users.push({ type: data.type || 'Employee', name: data.name || data.email.split('@')[0], email: data.email, password: data.password || '' });
    saveStore();
    return Promise.resolve(reply(201, { message: 'Utilisateur créé' }));
  }

  function listBills(user) {
    if (!user) {
      return Promise.resolve(reply(401, { message: 'Non connecté' }));
    }
    var bills = ensureStore().bills.filter(function (bill) {
      return user.type === 'Admin' || bill.email === user.email;
    });
    return Promise.resolve(reply(200, bills));
  }

  function createBill(body) {
    var file = null;
    var email = '';
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      file = body.get('file');
      email = String(body.get('email') || '');
    }
    return fileToImage(file).then(function (image) {
      var bill = {
        id: randomId(), email: email, status: 'pending', fileName: (file && file.name) || 'justificatif.jpg',
        name: '', type: '', amount: 0, date: '', vat: '', pct: 20, commentary: ''
      };
      bill.fileUrl = image || receiptImage({ name: bill.fileName, type: 'Justificatif envoyé', date: '', amount: 0 });
      ensureStore().bills.push(bill);
      saveStore();
      return reply(201, { fileUrl: bill.fileUrl, key: bill.id });
    });
  }

  function route(method, path, init) {
    ensureStore();
    var parts = path.split('?')[0].replace(/^\/+|\/+$/g, '').split('/');
    var body = init && init.body;
    var user = userFromRequest(init);
    if (parts[0] === 'auth' && parts[1] === 'login' && method === 'POST') {
      return login(body);
    }
    if (parts[0] === 'users') {
      if (method === 'POST') {
        return createUser(body);
      }
      var found = store.users.filter(function (item) { return item.email === parts[1] || item.name === parts[1]; })[0];
      return Promise.resolve(found ? reply(200, { type: found.type, name: found.name, email: found.email }) : reply(404, { message: 'Utilisateur introuvable' }));
    }
    if (parts[0] === 'bills') {
      if (!parts[1] && method === 'GET') {
        return listBills(user);
      }
      if (!parts[1] && method === 'POST') {
        return createBill(body);
      }
      var bill = store.bills.filter(function (item) { return item.id === parts[1]; })[0];
      if (!bill) {
        return Promise.resolve(reply(404, { message: 'Note de frais introuvable' }));
      }
      if (method === 'GET') {
        return Promise.resolve(reply(200, bill));
      }
      if (method === 'PATCH') {
        var changes = {};
        try { changes = JSON.parse(body); } catch (error) { /* corps invalide */ }
        Object.keys(changes).forEach(function (key) { if (key !== 'id') { bill[key] = changes[key]; } });
        saveStore();
        return Promise.resolve(reply(200, bill));
      }
      if (method === 'DELETE') {
        store.bills = store.bills.filter(function (item) { return item.id !== parts[1]; });
        saveStore();
        return Promise.resolve(reply(200, { message: 'Note de frais supprimée' }));
      }
    }
    return Promise.resolve(reply(404, { message: 'Route introuvable' }));
  }

  /* ---------- Interception de fetch ---------- */

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var match = API_URL.exec(url);
    if (!match) {
      return nativeFetch(input, init);
    }
    var method = String((init && init.method) || 'GET').toUpperCase();
    return route(method, match[1] || '/', init)
      .catch(function () { return reply(500, { message: 'Erreur de la démo' }); })
      .then(function (result) {
        return new Promise(function (resolve) {
          window.setTimeout(function () {
            resolve(new Response(JSON.stringify(result.payload), { status: result.status, headers: { 'Content-Type': 'application/json' } }));
          }, RESPONSE_DELAY);
        });
      });
  };

  /* ---------- Bandeau d’information ---------- */

  function showBanner() {
    try {
      if (window.sessionStorage.getItem(BANNER_KEY) === 'closed') {
        return;
      }
    } catch (error) { /* sessionStorage indisponible */ }
    var banner = document.createElement('div');
    banner.setAttribute('role', 'note');
    banner.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;max-width:340px;padding:10px 12px;' +
      'border-radius:10px;background:#1f2933;color:#fff;font:13px/1.45 Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)';
    banner.innerHTML = '<strong>Version de démonstration</strong> : l’API est simulée dans votre navigateur ' +
      '(les données restent sur votre appareil). Toutes les données sont fictives.<br>' +
      'Employé : <code style="color:#9cc2ff">' + ACCOUNTS.employee.email + '</code> / <code style="color:#9cc2ff">' + ACCOUNTS.employee.password + '</code><br>' +
      'Administrateur : <code style="color:#9cc2ff">' + ACCOUNTS.admin.email + '</code> / <code style="color:#9cc2ff">' + ACCOUNTS.admin.password + '</code><br>' +
      '<a href="#" data-reset style="color:#9cc2ff">Réinitialiser la démo</a> · <a href="#" data-close style="color:#9cc2ff">Fermer</a>';
    banner.querySelector('[data-close]').addEventListener('click', function (event) {
      event.preventDefault();
      try { window.sessionStorage.setItem(BANNER_KEY, 'closed'); } catch (error) { /* ignoré */ }
      banner.remove();
    });
    banner.querySelector('[data-reset]').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        window.localStorage.removeItem(STORE_KEY);
        window.localStorage.removeItem('jwt');
        window.localStorage.removeItem('user');
      } catch (error) { /* ignoré */ }
      window.location.href = ROOT;
    });
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
