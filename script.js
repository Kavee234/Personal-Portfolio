const greeting = document.querySelector("#greeting");
const skillDialog = document.querySelector(".skill-dialog");
const skillDialogTitle = document.querySelector("#skill-dialog-title");
const skillDialogDescription = document.querySelector(".skill-dialog-description");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateGreeting() {
    const hour = new Date().getHours();
    greeting.textContent = hour < 12 ? "Good morning, I'm" : hour < 18 ? "Good afternoon, I'm" : "Good evening, I'm";
}
updateGreeting();
window.setInterval(updateGreeting, 60_000);

document.querySelectorAll(".skill-button").forEach((button) => {
    button.addEventListener("click", () => {
        skillDialogTitle.textContent = button.dataset.skill;
        skillDialogDescription.textContent = button.dataset.description;
        skillDialog.showModal();
    });
});
document.querySelector(".skill-dialog-close").addEventListener("click", () => skillDialog.close());
skillDialog.addEventListener("click", (event) => {
    if (event.target === skillDialog) skillDialog.close();
});

if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}

const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (pointerFine && !reducedMotion) {
    let frame = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const art = document.querySelector(".hero-art");
    art.addEventListener("pointermove", (event) => {
        const rect = art.getBoundingClientRect();
        targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 9;
        targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 9;
        if (!frame) frame = requestAnimationFrame(moveArt);
    });
    art.addEventListener("pointerleave", () => { targetX = 0; targetY = 0; if (!frame) frame = requestAnimationFrame(moveArt); });
    function moveArt() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        art.style.setProperty("--pointer-x", `${currentX}px`);
        art.style.setProperty("--pointer-y", `${currentY}px`);
        art.querySelector(".hero-core").style.translate = `${currentX}px ${currentY}px`;
        if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) frame = requestAnimationFrame(moveArt);
        else frame = null;
    }
}
