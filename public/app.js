const API = '/api/shops';

const $ = (sel) => document.querySelector(sel);
const form = $('#shop-form');
const shopList = $('#shop-list');
const emptyState = $('#empty-state');
const ratingStars = $('#rating-stars');
const ratingInput = $('#rating');
const uploadZone = $('#upload-zone');
const imageInput = $('#image');
const preview = $('#preview');
const searchInput = $('#search');
const filterRating = $('#filter-rating');
const filterRetry = $('#filter-retry');

let editingId = null;
let debounceTimer;

function renderStars() {
  ratingStars.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '★';
    btn.dataset.value = String(i);
    if (Number(ratingInput.value) >= i) btn.classList.add('active');
    btn.addEventListener('click', () => {
      ratingInput.value = String(i);
      renderStars();
    });
    ratingStars.appendChild(btn);
  }
}

function starsText(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function ratingClass(r) {
  return `rating-badge r${r}`;
}

function cardClass(r) {
  if (r <= 2) return 'shop-card low';
  if (r >= 4) return 'shop-card high';
  return 'shop-card';
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    let detail = res.statusText;
    try {
      const err = JSON.parse(text);
      detail = err.message?.join?.() || err.message || err.error || detail;
    } catch {
      if (text && text.length < 200) detail = text;
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json();
}

async function loadStats() {
  const stats = await fetchJson(`${API}/stats`);
  $('#stat-total').textContent = stats.total;
  $('#stat-avg').textContent = stats.averageRating || '—';
  $('#stat-black').textContent = stats.blacklist;
}

function buildQuery() {
  const params = new URLSearchParams();
  const q = searchInput.value.trim();
  if (q) params.set('q', q);

  const fr = filterRating.value;
  if (fr === '1') {
    params.set('minRating', '1');
    params.set('maxRating', '1');
  } else if (fr === '2') {
    params.set('maxRating', '2');
  } else if (fr === '3') {
    params.set('minRating', '3');
  } else if (fr === '4') {
    params.set('minRating', '4');
  }

  if (filterRetry.checked) params.set('wouldRetry', 'true');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function loadShops() {
  const shops = await fetchJson(`${API}${buildQuery()}`);
  shopList.innerHTML = '';
  emptyState.hidden = shops.length > 0;

  for (const shop of shops) {
    const li = document.createElement('li');
    li.className = cardClass(shop.rating);

    const thumb = shop.imageUrl
      ? `<img class="shop-thumb" src="${shop.imageUrl}" alt="" />`
      : `<div class="shop-thumb placeholder">🏪</div>`;

    const retryTag = shop.wouldRetry
      ? '<span class="tag">会再去</span>'
      : '<span class="tag">不再点</span>';

    li.innerHTML = `
      ${thumb}
      <div class="shop-meta">
        <h3>${escapeHtml(shop.name)}</h3>
        <div class="tags">
          ${shop.platform ? `<span class="tag platform">${escapeHtml(shop.platform)}</span>` : ''}
          ${retryTag}
        </div>
        ${shop.address ? `<p class="notes-preview">${escapeHtml(shop.address)}</p>` : ''}
        ${shop.notes ? `<p class="notes-preview">${escapeHtml(shop.notes)}</p>` : ''}
      </div>
      <div class="card-actions">
        <span class="${ratingClass(shop.rating)}">${shop.rating} 分</span>
        <button type="button" class="btn ghost small" data-edit="${shop.id}">编辑</button>
        <button type="button" class="btn danger small" data-del="${shop.id}">删除</button>
      </div>
    `;

    li.querySelector('[data-edit]').addEventListener('click', () => startEdit(shop));
    li.querySelector('[data-del]').addEventListener('click', () => removeShop(shop.id));
    li.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      showDetail(shop);
    });

    shopList.appendChild(li);
  }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function resetForm() {
  editingId = null;
  form.reset();
  ratingInput.value = '3';
  renderStars();
  preview.hidden = true;
  preview.src = '';
  $('#form-title').textContent = '添加店铺';
  $('#submit-btn').textContent = '保存记录';
  $('#cancel-btn').hidden = true;
}

function startEdit(shop) {
  editingId = shop.id;
  $('#shop-id').value = shop.id;
  $('#name').value = shop.name;
  $('#platform').value = shop.platform || '';
  $('#address').value = shop.address || '';
  ratingInput.value = String(shop.rating);
  renderStars();
  $('#notes').value = shop.notes || '';
  $('#wouldRetry').checked = shop.wouldRetry;
  if (shop.imageUrl) {
    preview.src = shop.imageUrl;
    preview.hidden = false;
  }
  $('#form-title').textContent = '编辑店铺';
  $('#submit-btn').textContent = '更新记录';
  $('#cancel-btn').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDetail(shop) {
  const dlg = $('#detail-dialog');
  const article = $('#detail-content');
  article.innerHTML = `
    <h3>${escapeHtml(shop.name)}</h3>
    <p>${starsText(shop.rating)} · ${shop.rating} 分</p>
    ${shop.platform ? `<p>平台：${escapeHtml(shop.platform)}</p>` : ''}
    ${shop.address ? `<p>地址：${escapeHtml(shop.address)}</p>` : ''}
    ${shop.imageUrl ? `<img src="${shop.imageUrl}" alt="" />` : ''}
    ${shop.notes ? `<p>${escapeHtml(shop.notes)}</p>` : ''}
    <p><small>更新于 ${new Date(shop.updatedAt).toLocaleString('zh-CN')}</small></p>
  `;
  dlg.showModal();
}

async function removeShop(id) {
  if (!confirm('确定删除这条记录？')) return;
  await fetchJson(`${API}/${id}`, { method: 'DELETE' });
  await refresh();
}

async function refresh() {
  await Promise.all([loadStats(), loadShops()]);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('name', $('#name').value.trim());
  fd.append('rating', ratingInput.value);
  const platform = $('#platform').value;
  const address = $('#address').value.trim();
  const notes = $('#notes').value.trim();
  if (platform) fd.append('platform', platform);
  if (address) fd.append('address', address);
  if (notes) fd.append('notes', notes);
  fd.append('wouldRetry', $('#wouldRetry').checked ? 'true' : 'false');
  fd.append('visited', 'true');

  if (imageInput.files[0]) fd.append('image', imageInput.files[0]);

  const url = editingId ? `${API}/${editingId}` : API;
  const method = editingId ? 'PATCH' : 'POST';

  await fetchJson(url, { method, body: fd });
  resetForm();
  imageInput.value = '';
  await refresh();
});

$('#cancel-btn').addEventListener('click', resetForm);

uploadZone.addEventListener('click', () => imageInput.click());
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith('image/')) setPreview(file);
});
imageInput.addEventListener('change', () => {
  if (imageInput.files[0]) setPreview(imageInput.files[0]);
});

function setPreview(file) {
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
  const dt = new DataTransfer();
  dt.items.add(file);
  imageInput.files = dt.files;
}

function scheduleLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadShops().catch(console.error), 300);
}

searchInput.addEventListener('input', scheduleLoad);
filterRating.addEventListener('change', () => loadShops().catch(console.error));
filterRetry.addEventListener('change', () => loadShops().catch(console.error));

renderStars();
refresh().catch(async (err) => {
  console.error(err);
  let hint = err.message || '未知错误';
  try {
    const health = await fetch('/api/health').then((r) => r.json());
    console.log('health:', health);
    if (!health.db) {
      hint += `\n\n数据库: ${health.error || '未连接'}`;
      if (!health.env?.hasDatabaseUrl) {
        hint += '\n请在 Vercel 配置 DATABASE_URL（Neon Pooled 连接串）';
      }
    }
  } catch {
    hint += '\n\nAPI 无法访问，请检查 Vercel 部署日志';
  }
  alert(`加载失败：${hint}`);
});
