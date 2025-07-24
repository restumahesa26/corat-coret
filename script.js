window.onload = function() {
	// Mengambil elemen dari DOM
	const pencilBtn = document.getElementById('pencil-toggle');
	const resetBtn = document.getElementById('reset-btn');
	const uploadBtn = document.getElementById('upload-btn');
	const imageInput = document.getElementById('image-input');
	const emojiBtn = document.getElementById('emoji-btn');
	const emojiPicker = document.getElementById('emoji-picker');
	const colorPalette = document.getElementById('color-palette');
	const eraserBtn = document.getElementById('eraser-btn');
	const elementContainer = document.getElementById('element-container');
	const canvas = document.getElementById('drawingCanvas');
	const scratchpad = document.getElementById('scratchpad');
	const ctx = canvas.getContext('2d');

	let isDrawingMode = false;
	let isPainting = false;
	let isErasing = false;

	const emojis = ['😀', '😂', '😍', '🤔', '🎉', '👍', '❤️', '🚀', '🔥', '💡', '💯', '🙏', '✨', '💀', '👻', '👽', '👋', '👀'];
	const colors = ['#374151', '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7']; // Hitam, Merah, Biru, Hijau, Oranye, Ungu
	
	function populateEmojiPicker() {
		if (emojiPicker.children.length === 0) {
			emojis.forEach(emoji => {
				const emojiEl = document.createElement('div');
				emojiEl.classList.add('emoji-item');
				emojiEl.textContent = emoji;
				emojiEl.addEventListener('click', () => {
					createEmojiOnCanvas(emoji);
					hideEmojiPicker();
				});
				emojiPicker.appendChild(emojiEl);
			});
		}
	}
	
	// --- Logika Palet Warna dan Penghapus ---
	function populateColorPalette() {
		colors.forEach((color, index) => {
			const swatch = document.createElement('div');
			swatch.classList.add('color-swatch');
			swatch.style.backgroundColor = color;
			swatch.style.color = color;
			swatch.dataset.color = color;
			
			if (index === 0) swatch.classList.add('active');

			swatch.addEventListener('click', (e) => {
				isErasing = false;
				ctx.globalCompositeOperation = 'source-over';
				ctx.lineWidth = 3;
				const selectedColor = e.target.dataset.color;
				ctx.strokeStyle = selectedColor;
				
				document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
				eraserBtn.classList.remove('active');
				e.target.classList.add('active');
			});
			colorPalette.appendChild(swatch);
		});
	}
	
	eraserBtn.addEventListener('click', () => {
		isErasing = true;
		eraserBtn.classList.add('active');
		document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
		ctx.globalCompositeOperation = 'destination-out';
		ctx.lineWidth = 20; // Ukuran penghapus lebih besar
	});

	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		if (!isErasing) {
			const activeColor = document.querySelector('.color-swatch.active')?.dataset.color || colors[0];
			ctx.strokeStyle = activeColor;
			ctx.lineWidth = 3;
			ctx.globalCompositeOperation = 'source-over';
		} else {
			ctx.lineWidth = 20;
			ctx.globalCompositeOperation = 'destination-out';
		}
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
	}

	function resetAll() {
		scratchpad.value = '';
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		elementContainer.innerHTML = '';
	}

	// Inisialisasi
	populateColorPalette();
	resizeCanvas();
	populateEmojiPicker();
	window.addEventListener('resize', resizeCanvas);
	resetBtn.addEventListener('click', resetAll);

	// --- Logika Emoji dengan Animasi ---
	function showEmojiPicker() {
		emojiPicker.classList.remove('hidden');
		emojiPicker.classList.remove('animate-fadeOut');
		emojiPicker.classList.add('animate-fadeIn');
	}

	function hideEmojiPicker() {
		if (emojiPicker.classList.contains('hidden')) return;
		emojiPicker.classList.remove('animate-fadeIn');
		emojiPicker.classList.add('animate-fadeOut');
		emojiPicker.addEventListener('animationend', (e) => {
			if (e.animationName === 'fadeOut') {
				emojiPicker.classList.add('hidden');
			}
		}, { once: true });
	}

	emojiBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		if (emojiPicker.classList.contains('hidden')) {
			showEmojiPicker();
		} else {
			hideEmojiPicker();
		}
	});

	emojiPicker.addEventListener('click', (e) => e.stopPropagation());
	window.addEventListener('click', hideEmojiPicker);

	function createEmojiOnCanvas(emoji) {
		const wrapper = document.createElement('div');
		wrapper.classList.add('emoji-wrapper');
		wrapper.textContent = emoji;
		elementContainer.appendChild(wrapper);
		wrapper.style.left = `${(window.innerWidth - 50) / 2}px`;
		wrapper.style.top = `${(window.innerHeight - 50) / 2}px`;
		makeDraggable(wrapper);
	}

	// --- Logika Gambar (Upload, Drag, Resize) ---
	function loadImage(file) {
		if (file && file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => createImageOnCanvas(e.target.result);
			reader.readAsDataURL(file);
		}
	}

	function createImageOnCanvas(src) {
		const wrapper = document.createElement('div');
		wrapper.classList.add('image-wrapper');
		const img = document.createElement('img');
		img.src = src;
		const resizeHandle = document.createElement('div');
		resizeHandle.classList.add('resize-handle');
		wrapper.appendChild(img);
		wrapper.appendChild(resizeHandle);
		elementContainer.appendChild(wrapper);
		wrapper.style.left = `${(window.innerWidth - 200) / 2}px`;
		wrapper.style.top = `${(window.innerHeight - 200) / 2}px`;
		wrapper.style.width = '200px';
		makeDraggable(wrapper);
		makeResizable(wrapper, resizeHandle);
	}
	
	uploadBtn.addEventListener('click', () => imageInput.click());
	imageInput.addEventListener('change', (e) => {
		if (e.target.files.length > 0) loadImage(e.target.files[0]);
	});

	document.body.addEventListener('dragover', (e) => e.preventDefault());
	document.body.addEventListener('drop', (e) => {
		e.preventDefault();
		if (e.dataTransfer.files.length > 0) loadImage(e.dataTransfer.files[0]);
	});

	function makeDraggable(element) {
		let offsetX, offsetY;
		const onMouseDown = (e) => {
			if (e.target.classList.contains('resize-handle')) return;
			e.preventDefault();
			
			const event = e.touches ? e.touches[0] : e;
			offsetX = event.clientX - element.offsetLeft;
			offsetY = event.clientY - element.offsetTop;

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
			document.addEventListener('touchmove', onMouseMove);
			document.addEventListener('touchend', onMouseUp);
		};

		const onMouseMove = (e) => {
			const event = e.touches ? e.touches[0] : e;
			element.style.left = `${event.clientX - offsetX}px`;
			element.style.top = `${event.clientY - offsetY}px`;
		};

		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			document.removeEventListener('touchmove', onMouseMove);
			document.removeEventListener('touchend', onMouseUp);
		};
		
		element.addEventListener('mousedown', onMouseDown);
		element.addEventListener('touchstart', onMouseDown);
	}
	
	function makeResizable(element, handle) {
		let startX, startY, startWidth, startHeight;
		handle.addEventListener('mousedown', (e) => {
			e.preventDefault();
			e.stopPropagation();
			startX = e.clientX;
			startY = e.clientY;
			startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
			startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});

		function onMouseMove(e) {
			const newWidth = startWidth + (e.clientX - startX);
			const newHeight = startHeight + (e.clientY - startY);
			element.style.width = `${newWidth > 50 ? newWidth : 50}px`;
			element.style.height = `${newHeight > 50 ? newHeight : 50}px`;
		}

		function onMouseUp() {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		}
	}

	// --- Logika Menggambar ---
	function getPaintPosition(event) {
		const eventPos = event.touches ? event.touches[0] : event;
		return { x: eventPos.clientX, y: eventPos.clientY };
	}

	function startPosition(event) {
		if (!isDrawingMode) return;
		event.preventDefault();
		isPainting = true;
		const { x, y } = getPaintPosition(event);
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function finishedPosition() {
		isPainting = false;
		ctx.beginPath();
	}

	function draw(event) {
		if (!isPainting || !isDrawingMode) return;
		event.preventDefault();
		const { x, y } = getPaintPosition(event);
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	canvas.addEventListener('mousedown', startPosition);
	canvas.addEventListener('mouseup', finishedPosition);
	canvas.addEventListener('mousemove', draw);
	canvas.addEventListener('mouseleave', finishedPosition);
	canvas.addEventListener('touchstart', startPosition);
	canvas.addEventListener('touchend', finishedPosition);
	canvas.addEventListener('touchmove', draw);

	pencilBtn.addEventListener('click', () => {
		isDrawingMode = !isDrawingMode;
		pencilBtn.classList.toggle('active', isDrawingMode);
		canvas.style.pointerEvents = isDrawingMode ? 'auto' : 'none';
		
		// Tampilkan atau sembunyikan palet warna
		colorPalette.classList.toggle('hidden', !isDrawingMode);
	});
};