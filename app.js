let currentFile = null;
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const previewSection = document.getElementById("previewSection");
const downloadSection = document.getElementById("downloadSection");
const imagePreview = document.getElementById("imagePreview");
const downloadLink = document.getElementById("downloadLink");
const copyLinkBtn = document.getElementById("copyLinkBtn");

dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => {
	e.preventDefault();
	dropZone.classList.add("dragover");
};
dropZone.ondragleave = () => dropZone.classList.remove("dragover");
dropZone.ondrop = (e) => {
	e.preventDefault();
	dropZone.classList.remove("dragover");
	handleFiles(e.dataTransfer.files);
};
fileInput.onchange = (e) => handleFiles(e.target.files);

function handleFiles(files) {
	if (!files.length) return;
	const file = files[0];
	if (!file.type.startsWith("image/")) return;
	currentFile = file;
	const reader = new FileReader();
	reader.onload = (e) => {
		imagePreview.src = e.target.result;
		imagePreview.onload = () => {
			previewSection.style.display = "block";
			downloadSection.style.display = "none";
			convertToGif();
		};
	};
	reader.readAsDataURL(file);
}

document.addEventListener("paste", (e) => {
	const items = e.clipboardData.items;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.type.startsWith("image/")) {
			const file = item.getAsFile();
			handleFiles([file]);
			e.preventDefault();
			break;
		}
	}
});

function convertToGif() {
	if (!currentFile) return;
	const img = imagePreview;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	let width = img.naturalWidth,
		height = img.naturalHeight;
	if (width > 800 || height > 800) {
		const ratio = Math.min(800 / width, 800 / height);
		width = Math.floor(width * ratio);
		height = Math.floor(height * ratio);
	}
	canvas.width = width;
	canvas.height = height;
	ctx.drawImage(img, 0, 0, width, height);

	const gif = new GIF({
		workers: 2,
		quality: 10,
		width,
		height,
		workerScript: "./gif.worker.js",
	});
	gif.addFrame(ctx, { copy: true, delay: 200 });
	gif.on("finished", async (blob) => {
		downloadLink.href = URL.createObjectURL(blob);
		downloadLink.download = currentFile.name.replace(/\.[^/.]+$/, "") + ".gif";
		downloadSection.style.display = "flex";

		const formData = new FormData();
		formData.append("image", blob, downloadLink.download);
		const res = await fetch("https://smht.eu/proxy/index.php", {
			method: "POST",
			body: formData,
		});
		const data = await res.json();
		if (data.success && data.data && data.data.url) {
			copyLinkBtn.onclick = () => {
				navigator.clipboard.writeText(data.data.url);
			};
		}
	});
	gif.render();
}
