const BASE_URL = `${CONFIG.BASE_URL}`;

const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
});
document.addEventListener('mousedown', () => { cursor.style.transform = 'translate(-50%,-50%) scale(0.6)'; });
document.addEventListener('mouseup', () => { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; });

const bits = ['0', '1', '//', '&&', '>>', '<<', '{}', '[]', '()', '/*', '*/', '0x'];
for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'bit';
    el.textContent = bits[Math.floor(Math.random() * bits.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (18 + Math.random() * 20) + 's';
    el.style.animationDelay = (Math.random() * 20) + 's';
    document.body.appendChild(el);
}

function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((b, i) => {
        b.classList.toggle('active', (i === 0 && name === 'upload') || (i === 1 && name === 'download'));
    });
}

let selectedFiles = [];

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    addFiles([...e.dataTransfer.files]);
});
fileInput.addEventListener('change', () => addFiles([...fileInput.files]));

const BLOCKED = ['exe', 'bat', 'sh'];
const MAX_BYTES = 50 * 1024 * 1024;

function addFiles(newFiles) {
    const err = document.getElementById('uploadError');
    hideMsg(err);
    for (const f of newFiles) {
        const ext = f.name.split('.').pop().toLowerCase();
        if (BLOCKED.includes(ext)) { showMsg(err, `"${f.name}" — blocked file type (.${ext})`); continue; }
        if (selectedFiles.find(x => x.name === f.name)) continue;
        selectedFiles.push(f);
    }
    const total = selectedFiles.reduce((a, f) => a + f.size, 0);
    if (total > MAX_BYTES) {
        showMsg(err, `Total size exceeds 50 MB. Please remove some files.`);
        selectedFiles = selectedFiles.filter((_, i) => i < selectedFiles.length - newFiles.length);
    }
    renderFileList();
    document.getElementById('uploadBtn').disabled = selectedFiles.length === 0;
    document.getElementById('uploadResult').style.display = 'none';
}

function removeFile(idx) {
    selectedFiles.splice(idx, 1);
    renderFileList();
    document.getElementById('uploadBtn').disabled = selectedFiles.length === 0;
}

function renderFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    selectedFiles.forEach((f, i) => {
        list.innerHTML += `
        <div class="file-item">
          <div class="file-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
          <div class="file-info">
            <div class="file-name">${f.name}</div>
            <div class="file-size">${fmtSize(f.size)}</div>
          </div>
          <button class="file-remove" onclick="removeFile(${i})">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>`;
    });
}

async function handleUpload() {
    const btn = document.getElementById('uploadBtn');
    const err = document.getElementById('uploadError');
    const prog = document.getElementById('progressWrap');
    hideMsg(err);
    document.getElementById('uploadResult').style.display = 'none';

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Uploading...';
    prog.classList.add('show');
    animateProgress('progressFill', 'progressPct', 80, 1200);

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('files', f));

    try {
        const res = await fetch(`${BASE_URL}/file/upload`, { method: 'POST', body: formData });
        const data = await res.json();

        setProgress('progressFill', 'progressPct', 100);
        document.getElementById('progressStatus').textContent = 'Done!';

        if (!res.ok) throw new Error(data.message || `Error ${res.status}`);

        document.getElementById('resultCode').textContent = data.data.accessCode;
        document.getElementById('resultExpiry').textContent = new Date(data.data.expiresAt).toLocaleString();
        // document.getElementById('resultUrl').href = data.url;
        document.getElementById('uploadResult').style.display = 'block';

        selectedFiles = [];
        renderFileList();
        fileInput.value = '';
    } catch (e) {
        showMsg(err, e.message || 'Upload failed. Is your server running?');
        prog.classList.remove('show');
    } finally {
        btn.innerHTML = 'Upload &amp; Generate Code';
        btn.disabled = selectedFiles.length === 0;
        setTimeout(() => prog.classList.remove('show'), 1500);
    }
}

function copyCode() {
    const code = document.getElementById('resultCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'COPIED!';
        btn.style.color = 'var(--success)';
        btn.style.borderColor = 'var(--success)';
        setTimeout(() => { btn.textContent = 'COPY'; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
    });
}

function onCodeInput(el) {
    const v = el.value.trim();
    document.getElementById('downloadBtn').disabled = v.length < 3;
    ['downloadError', 'downloadInfo', 'downloadSuccess'].forEach(id => hideMsg(document.getElementById(id)));
}

async function handleDownload() {
    const code = document.getElementById('codeInput').value.trim();
    if (!code || code.length < 3) return;

    const btn = document.getElementById('downloadBtn');
    const errEl = document.getElementById('downloadError');
    const infoEl = document.getElementById('downloadInfo');
    const okEl = document.getElementById('downloadSuccess');
    const prog = document.getElementById('downloadProgressWrap');

    ['downloadError', 'downloadInfo', 'downloadSuccess'].forEach(id => hideMsg(document.getElementById(id)));

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Retrieving...';
    prog.classList.add('show');
    animateProgress('downloadProgressFill', null, 70, 800);

    try {
        const res = await fetch(`${BASE_URL}/file/download/${encodeURIComponent(code)}`);

        if (res.status === 404) throw { code: 404, msg: 'No bundle found for this access code.' };
        if (res.status === 410) throw { code: 410, msg: 'This bundle has expired and been deleted.' };
        if (res.status === 429) throw { code: 429, msg: 'Rate limit exceeded. Try again in a moment.' };
        if (res.status === 500) throw { code: 500, msg: 'Storage server unreachable. Try again later.' };
        if (!res.ok) throw { code: res.status, msg: `Unexpected error (${res.status}).` };

        setProgress('downloadProgressFill', null, 100);
        document.getElementById('downloadProgressStatus').textContent = 'Saving file...';

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `secure-drop-${code}.zip`;
        a.click();
        URL.revokeObjectURL(url);

        showMsg(okEl, '✓ Download started — check your downloads folder.');
    } catch (e) {
        prog.classList.remove('show');
        showMsg(errEl, e.msg || e.message || 'Download failed.');
    } finally {
        btn.innerHTML = 'Download ZIP Bundle';
        btn.disabled = false;
        setTimeout(() => prog.classList.remove('show'), 1500);
    }
}

function showMsg(el, text) { el.textContent = text; el.classList.add('show'); }
function hideMsg(el) { el.classList.remove('show'); }
function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function animateProgress(fillId, pctId, target, duration) {
    let start = null;
    const fill = document.getElementById(fillId);
    const pctEl = pctId ? document.getElementById(pctId) : null;
    function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1) * target;
        fill.style.width = p + '%';
        if (pctEl) pctEl.textContent = Math.round(p) + '%';
        if (p < target) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function setProgress(fillId, pctId, val) {
    document.getElementById(fillId).style.width = val + '%';
    if (pctId) document.getElementById(pctId).textContent = val + '%';
}


// In my backend, for download the response is set at headers, so check if its coming from there or not
// For an error, 'Failed to Fetch' k jgh, 'Failed to upload' daalo
// In the reponse of expire time, set it to IST
// Download waale section se neeche rate limit, ttl, format yh sb hatao
// kuch cheeze properly align ni h usko align kro