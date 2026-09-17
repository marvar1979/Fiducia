(() => {
  'use strict';
  const products = Array.isArray(window.FIDUSIA_PRODUCTS) ? window.FIDUSIA_PRODUCTS : [];
  const users = [
    {role:'Administrador',email:'admin@fidusia.bo',password:'Admin123!',name:'Admin Fidusia'},
    {role:'Ventas',email:'ventas@fidusia.bo',password:'Ventas123!',name:'Equipo Ventas'},
    {role:'Almacén',email:'almacen@fidusia.bo',password:'Stock123!',name:'Equipo Almacén'},
    {role:'Cliente',email:'cliente@fidusia.bo',password:'Cliente123!',name:'Cliente Demo'}
  ];
  const state = {
    cart: JSON.parse(localStorage.getItem('fidusia_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('fidusia_wishlist') || '[]'),
    user: JSON.parse(sessionStorage.getItem('fidusia_user') || 'null'),
    filter: {search:'',category:'Todos',sort:'featured'}
  };
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const money = n => `Bs. ${Number(n).toFixed(2).replace('.', ',')}`;
  const save = () => {
    localStorage.setItem('fidusia_cart', JSON.stringify(state.cart));
    localStorage.setItem('fidusia_wishlist', JSON.stringify(state.wishlist));
  };
  function showToast(message){
    qs('#toastMessage').textContent = message;
    const toastEl = qs('#appToast');
    if(window.bootstrap && toastEl) bootstrap.Toast.getOrCreateInstance(toastEl,{delay:2300}).show();
  }
  function productById(id){ return products.find(p => p.id === Number(id)); }
  function renderProducts(){
    let list = [...products];
    const term = state.filter.search.trim().toLowerCase();
    if(term) list = list.filter(p => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(term));
    if(state.filter.category !== 'Todos') list = list.filter(p => p.category === state.filter.category);
    if(state.filter.sort === 'priceAsc') list.sort((a,b)=>a.price-b.price);
    if(state.filter.sort === 'priceDesc') list.sort((a,b)=>b.price-a.price);
    if(state.filter.sort === 'rating') list.sort((a,b)=>b.rating-a.rating);
    const grid = qs('#productGrid');
    grid.innerHTML = list.map(p => {
      const wished = state.wishlist.includes(p.id);
      return `<div class="col-12 col-sm-6 col-lg-3">
        <article class="product-card">
          <div class="product-image-wrap">
            <img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/700x700/fff0f5/7d294e?text=Fidusia'">
            <span class="product-badge">${p.badge}</span>
            <button class="wishlist-toggle ${wished?'active':''}" data-action="wishlist" data-id="${p.id}" aria-label="${wished?'Quitar de favoritos':'Añadir a favoritos'}"><i class="bi ${wished?'bi-heart-fill':'bi-heart'}"></i></button>
          </div>
          <div class="product-body">
            <div class="product-brand">${p.brand}</div>
            <h3 class="product-title">${p.name}</h3>
            <div class="product-meta"><span class="rating"><i class="bi bi-star-fill"></i> ${p.rating}</span><span class="price">${money(p.price)}${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:''}</span></div>
            <div class="product-actions"><button class="btn btn-fidusia btn-sm" data-action="add" data-id="${p.id}"><i class="bi bi-bag-plus me-1"></i>Añadir</button><button class="btn quick-btn btn-sm" data-action="view" data-id="${p.id}"><i class="bi bi-eye"></i></button></div>
          </div>
        </article>
      </div>`;
    }).join('');
    qs('#emptyProducts').classList.toggle('d-none', list.length > 0);
  }
  function updateCounters(){
    qs('#cartCount').textContent = state.cart.reduce((a,c)=>a+c.qty,0);
    qs('#wishlistCount').textContent = state.wishlist.length;
  }
  function addToCart(id){
    const p = productById(id); if(!p) return;
    const existing = state.cart.find(i=>i.id===p.id);
    if(existing){ if(existing.qty < p.stock) existing.qty++; }
    else state.cart.push({id:p.id,qty:1});
    save(); renderCart(); updateCounters(); showToast(`${p.name} se añadió al carrito`);
  }
  function toggleWishlist(id){
    id = Number(id);
    const i = state.wishlist.indexOf(id);
    if(i >= 0) state.wishlist.splice(i,1); else state.wishlist.push(id);
    save(); updateCounters(); renderProducts();
    showToast(i >= 0 ? 'Producto retirado de favoritos' : 'Producto guardado en favoritos');
  }
  function renderCart(){
    const wrap = qs('#cartItems');
    if(!state.cart.length){ wrap.innerHTML = `<div class="empty-state py-5"><i class="bi bi-bag"></i><h5 class="mt-3">Tu carrito está vacío</h5><p>Agrega tus favoritos para comenzar.</p></div>`; }
    else wrap.innerHTML = state.cart.map(i=>{
      const p=productById(i.id); if(!p) return '';
      return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><h6>${p.name}</h6><small>${money(p.price)}</small><div class="qty-controls"><button data-cart="dec" data-id="${p.id}">−</button><span>${i.qty}</span><button data-cart="inc" data-id="${p.id}">+</button></div></div><button class="remove-cart" data-cart="remove" data-id="${p.id}" aria-label="Eliminar"><i class="bi bi-trash"></i></button></div>`;
    }).join('');
    const subtotal = state.cart.reduce((sum,i)=>{const p=productById(i.id);return sum+(p?p.price*i.qty:0)},0);
    qs('#cartSubtotal').textContent = money(subtotal); qs('#checkoutTotal').textContent = money(subtotal);
  }
  function changeQty(id,delta){
    const item=state.cart.find(i=>i.id===Number(id)); const p=productById(id); if(!item||!p)return;
    item.qty=Math.max(1,Math.min(p.stock,item.qty+delta)); save();renderCart();updateCounters();
  }
  function removeCart(id){state.cart=state.cart.filter(i=>i.id!==Number(id));save();renderCart();updateCounters();}
  function openProduct(id){
    const p=productById(id); if(!p)return;
    qs('#productModalContent').innerHTML=`<div class="modal-header border-0 pb-0"><button class="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body pt-0"><div class="row g-4 align-items-center"><div class="col-md-6"><img class="product-modal-img" src="${p.image}" alt="${p.name}"></div><div class="col-md-6"><span class="eyebrow">${p.brand}</span><h2 class="mt-2">${p.name}</h2><div class="rating mb-3"><i class="bi bi-star-fill"></i> ${p.rating} · ${p.skin}</div><p class="text-secondary">${p.description}</p><div class="price fs-3 mb-3">${money(p.price)}</div><div class="small text-secondary mb-3">Stock disponible: ${p.stock}</div><button class="btn btn-fidusia btn-lg w-100" data-modal-add="${p.id}"><i class="bi bi-bag-plus me-2"></i>Añadir al carrito</button></div></div></div>`;
    if(window.bootstrap) bootstrap.Modal.getOrCreateInstance(qs('#productModal')).show();
  }
  function routine(){
    const val=qs('#skinConcern').value;
    const plans={
      hidratacion:['Rose Dew Gentle Cleanser','Golden Peptide Serum','Cloud Barrier Cream','Pink Shield SPF 50'],
      luminosidad:['Rose Dew Gentle Cleanser','Niacinamide Balance Drops','Cloud Barrier Cream','Pink Shield SPF 50'],
      grasa:['Soft Melt Cleansing Balm','Niacinamide Balance Drops','Petal Milk Toner','Pink Shield SPF 50'],
      sensibilidad:['Rose Dew Gentle Cleanser','Petal Milk Toner','Cloud Barrier Cream','Pink Shield SPF 50']
    };
    qs('#routineResult').innerHTML=(plans[val]||plans.hidratacion).map((name,i)=>`<div class="routine-step"><span>${i+1}</span><div><strong>${['Limpia','Trata','Hidrata','Protege'][i]}</strong><div class="small text-secondary">${name}</div></div></div>`).join('');
  }
  function login(email,password){return users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===password);}
  function renderRolePanel(){
    const section=qs('#rolePanelSection'), user=state.user;
    if(!user){section.classList.add('d-none');qs('#accountBtn').innerHTML='<i class="bi bi-person me-1"></i> Cuenta';return;}
    section.classList.remove('d-none');qs('#accountBtn').innerHTML=`<i class="bi bi-person-check me-1"></i> ${user.role}`;
    qs('#rolePanelTitle').textContent=`Panel de ${user.role}`;
    const subtitle={Administrador:'Control general de catálogo, pedidos, usuarios y métricas.',Ventas:'Seguimiento de pedidos, clientes y estado de ventas.',Almacén:'Gestión de inventario, disponibilidad y reposición.',Cliente:'Resumen de cuenta, pedidos y favoritos.'}[user.role];
    qs('#rolePanelSubtitle').textContent=subtitle;
    const metrics=`<div class="row g-3 mb-4"><div class="col-6 col-lg-3"><div class="admin-card metric"><div class="metric-icon"><i class="bi bi-bag-check"></i></div><div><strong>28</strong><span>Pedidos hoy</span></div></div></div><div class="col-6 col-lg-3"><div class="admin-card metric"><div class="metric-icon"><i class="bi bi-cash-stack"></i></div><div><strong>Bs. 4.860</strong><span>Venta demo</span></div></div></div><div class="col-6 col-lg-3"><div class="admin-card metric"><div class="metric-icon"><i class="bi bi-boxes"></i></div><div><strong>${products.reduce((a,p)=>a+p.stock,0)}</strong><span>Unidades stock</span></div></div></div><div class="col-6 col-lg-3"><div class="admin-card metric"><div class="metric-icon"><i class="bi bi-people"></i></div><div><strong>1.248</strong><span>Clientes</span></div></div></div></div>`;
    const orders=`<div class="admin-card"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Pedidos recientes</h4><span class="status-pill">Demo interactiva</span></div><div class="table-responsive"><table class="table table-fidusia align-middle mb-0"><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody><tr><td>#FD-1048</td><td>Camila R.</td><td>Bs. 338,00</td><td><span class="status-pill">Preparando</span></td></tr><tr><td>#FD-1047</td><td>Andrea M.</td><td>Bs. 165,00</td><td><span class="status-pill">Pagado</span></td></tr><tr><td>#FD-1046</td><td>Valeria S.</td><td>Bs. 287,00</td><td><span class="status-pill">Enviado</span></td></tr></tbody></table></div></div>`;
    const inventory=`<div class="admin-card"><h4>Inventario</h4><div class="table-responsive"><table class="table table-fidusia align-middle"><thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Estado</th></tr></thead><tbody>${products.map(p=>`<tr><td>${p.name}</td><td>${p.category}</td><td>${p.stock}</td><td><span class="status-pill">${p.stock<10?'Reponer pronto':'Disponible'}</span></td></tr>`).join('')}</tbody></table></div></div>`;
    const client=`<div class="row g-4"><div class="col-lg-6"><div class="admin-card h-100"><h4>Mi cuenta</h4><p class="text-secondary">Sesión demo activa como ${user.name}.</p><div class="mt-4"><strong>Favoritos guardados</strong><div class="display-6 text-danger">${state.wishlist.length}</div></div></div></div><div class="col-lg-6"><div class="admin-card h-100"><h4>Último pedido</h4><p>#FD-1039 · Bs. 288,00</p><span class="status-pill">Entregado</span></div></div></div>`;
    qs('#rolePanelContent').innerHTML=user.role==='Cliente'?client:(user.role==='Almacén'?inventory:metrics+orders);
  }
  document.addEventListener('click',e=>{
    const action=e.target.closest('[data-action]'); if(action){const id=action.dataset.id;if(action.dataset.action==='add')addToCart(id);if(action.dataset.action==='wishlist')toggleWishlist(id);if(action.dataset.action==='view')openProduct(id);}
    const cart=e.target.closest('[data-cart]'); if(cart){if(cart.dataset.cart==='inc')changeQty(cart.dataset.id,1);if(cart.dataset.cart==='dec')changeQty(cart.dataset.id,-1);if(cart.dataset.cart==='remove')removeCart(cart.dataset.id);}
    const modalAdd=e.target.closest('[data-modal-add]'); if(modalAdd){addToCart(modalAdd.dataset.modalAdd);if(window.bootstrap)bootstrap.Modal.getInstance(qs('#productModal'))?.hide();}
  });
  qs('#searchInput').addEventListener('input',e=>{state.filter.search=e.target.value;renderProducts();});
  qs('#categoryFilter').addEventListener('change',e=>{state.filter.category=e.target.value;renderProducts();});
  qs('#sortFilter').addEventListener('change',e=>{state.filter.sort=e.target.value;renderProducts();});
  qsa('.category-card').forEach(btn=>btn.addEventListener('click',()=>{qs('#categoryFilter').value=btn.dataset.category;state.filter.category=btn.dataset.category;renderProducts();qs('#tienda').scrollIntoView({behavior:'smooth'});}));
  qs('#searchFocusBtn').addEventListener('click',()=>{qs('#tienda').scrollIntoView({behavior:'smooth'});setTimeout(()=>qs('#searchInput').focus(),450);});
  qs('#wishlistBtn').addEventListener('click',()=>{state.filter.search='';state.filter.category='Todos';qs('#searchInput').value='';qs('#categoryFilter').value='Todos';let ids=new Set(state.wishlist);const grid=qs('#productGrid');if(!ids.size){showToast('Aún no tienes favoritos');return;}grid.innerHTML=products.filter(p=>ids.has(p.id)).map(p=>`<div class="col-12 col-sm-6 col-lg-3"><article class="product-card"><div class="product-image-wrap"><img class="product-image" src="${p.image}" alt="${p.name}"><span class="product-badge">Favorito</span><button class="wishlist-toggle active" data-action="wishlist" data-id="${p.id}"><i class="bi bi-heart-fill"></i></button></div><div class="product-body"><div class="product-brand">${p.brand}</div><h3 class="product-title">${p.name}</h3><div class="product-meta"><span class="rating"><i class="bi bi-star-fill"></i> ${p.rating}</span><span class="price">${money(p.price)}</span></div><div class="product-actions"><button class="btn btn-fidusia btn-sm" data-action="add" data-id="${p.id}">Añadir</button><button class="btn quick-btn btn-sm" data-action="view" data-id="${p.id}"><i class="bi bi-eye"></i></button></div></div></article></div>`).join('');qs('#tienda').scrollIntoView({behavior:'smooth'});});
  qs('#routineBtn').addEventListener('click',routine);
  qs('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();showToast('¡Bienvenida a Fidusia Club!');e.target.reset();});
  qs('#contactForm').addEventListener('submit',e=>{e.preventDefault();showToast('Mensaje recibido. Gracias por escribirnos.');e.target.reset();});
  qs('#loginForm').addEventListener('submit',e=>{e.preventDefault();const u=login(qs('#loginEmail').value,qs('#loginPassword').value);if(!u){showToast('Credenciales incorrectas');return;}state.user={role:u.role,email:u.email,name:u.name};sessionStorage.setItem('fidusia_user',JSON.stringify(state.user));renderRolePanel();showToast(`Sesión iniciada como ${u.role}`);if(window.bootstrap)bootstrap.Modal.getInstance(qs('#loginModal'))?.hide();setTimeout(()=>qs('#rolePanelSection').scrollIntoView({behavior:'smooth'}),250);});
  qs('#logoutBtn').addEventListener('click',()=>{state.user=null;sessionStorage.removeItem('fidusia_user');renderRolePanel();showToast('Sesión cerrada');qs('#inicio').scrollIntoView({behavior:'smooth'});});
  qs('#checkoutBtn').addEventListener('click',()=>{if(!state.cart.length){showToast('Tu carrito está vacío');return;}if(window.bootstrap){bootstrap.Offcanvas.getInstance(qs('#cartCanvas'))?.hide();setTimeout(()=>bootstrap.Modal.getOrCreateInstance(qs('#checkoutModal')).show(),250);}});
  qs('#checkoutForm').addEventListener('submit',e=>{e.preventDefault();state.cart=[];save();renderCart();updateCounters();if(window.bootstrap)bootstrap.Modal.getInstance(qs('#checkoutModal'))?.hide();showToast('Pedido demo confirmado: #FD-'+Math.floor(1100+Math.random()*800));e.target.reset();});
  renderProducts();renderCart();updateCounters();renderRolePanel();routine();
})();
