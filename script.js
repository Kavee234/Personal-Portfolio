const greeting = document.querySelector("#greeting");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollProgress = document.querySelector(".scroll-progress");

function updateScrollProgress() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    scrollProgress.style.setProperty("--scroll-progress", `${progress}`);
}

let scrollUpdatePending = false;
window.addEventListener("scroll", () => {
    if (scrollUpdatePending) return;
    scrollUpdatePending = true;
    window.requestAnimationFrame(() => {
        updateScrollProgress();
        scrollUpdatePending = false;
    });
}, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

function updateGreeting() {
    const hour = new Date().getHours();
    greeting.textContent = hour < 12 ? "Good morning, I'm" : hour < 18 ? "Good afternoon, I'm" : "Good evening, I'm";
}
updateGreeting();
window.setInterval(updateGreeting, 60_000);

const soundTargetSelector = "a, button, input, textarea, select, [role='button'], [tabindex]:not([tabindex='-1'])";
let uiAudioContext;
let uiAudioReady = false;
let uiAudioUnavailable = false;

function playUiTone(kind) {
    if (!uiAudioContext || !uiAudioReady) return;

    const oscillator = uiAudioContext.createOscillator();
    const volume = uiAudioContext.createGain();
    const startTime = uiAudioContext.currentTime;
    const isClick = kind === "click";

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(isClick ? 520 : 740, startTime);
    volume.gain.setValueAtTime(0.0001, startTime);
    volume.gain.exponentialRampToValueAtTime(isClick ? 0.045 : 0.025, startTime + 0.008);
    volume.gain.exponentialRampToValueAtTime(0.0001, startTime + (isClick ? 0.09 : 0.045));
    oscillator.connect(volume);
    volume.connect(uiAudioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + (isClick ? 0.095 : 0.05));
}

function enableUiAudio() {
    if (uiAudioUnavailable) return;

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
        uiAudioUnavailable = true;
        console.warn("UI sounds are unavailable because this browser does not support the Web Audio API.");
        return;
    }

    try {
        uiAudioContext ??= new AudioContextConstructor();
        uiAudioContext.resume().then(() => {
            uiAudioReady = true;
            playUiTone("click");
        }).catch((error) => {
            uiAudioUnavailable = true;
            console.warn("UI sounds could not be enabled.", error);
        });
    } catch (error) {
        uiAudioUnavailable = true;
        console.warn("UI sounds could not be initialized.", error);
    }
}

document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
    const target = event.target.closest(soundTargetSelector);
    if (!target || (event.relatedTarget instanceof Element && target.contains(event.relatedTarget))) return;
    playUiTone("hover");
});

document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(soundTargetSelector)) return;
    if (!uiAudioReady) {
        enableUiAudio();
        return;
    }
    playUiTone("click");
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

const portraitFrame = document.querySelector(".portrait-frame");
function revealAnimeAt(clientX, clientY) {
    const rect = portraitFrame.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    portraitFrame.style.setProperty("--anime-x", `${x}px`);
    portraitFrame.style.setProperty("--anime-y", `${y}px`);
    portraitFrame.style.setProperty("--anime-reveal-radius", "92px");
}

function hideAnimeReveal() {
    portraitFrame.style.setProperty("--anime-reveal-radius", "0px");
}

portraitFrame.addEventListener("pointermove", (event) => revealAnimeAt(event.clientX, event.clientY));
portraitFrame.addEventListener("pointerdown", (event) => revealAnimeAt(event.clientX, event.clientY));
portraitFrame.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch" && document.activeElement !== portraitFrame) hideAnimeReveal();
});
portraitFrame.addEventListener("focus", () => {
    portraitFrame.style.setProperty("--anime-x", "50%");
    portraitFrame.style.setProperty("--anime-y", "50%");
    portraitFrame.style.setProperty("--anime-reveal-radius", "92px");
});
portraitFrame.addEventListener("blur", hideAnimeReveal);

function createSpherePoints(count) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: count }, (_, index) => {
        const y = 1 - (index / (count - 1)) * 2;
        const ringRadius = Math.sqrt(1 - y * y);
        const angle = goldenAngle * index;
        return { x: Math.cos(angle) * ringRadius, y, z: Math.sin(angle) * ringRadius };
    });
}

function setupTechnologySphere(sphere, options = {}) {
    if (!sphere) return;

    const tagList = sphere.querySelector("ul");
    const originalTags = [...tagList.children];
    for (let copy = 0; copy < (options.duplicateCount ?? 2); copy += 1) {
        originalTags.forEach((tag) => {
            const duplicate = tag.cloneNode(true);
            duplicate.setAttribute("aria-hidden", "true");
            tagList.append(duplicate);
        });
    }

    const tags = [...tagList.querySelectorAll("li")];
    const points = createSpherePoints(tags.length);
    let rotationX = -0.2;
    let rotationY = 0.25;
    let dragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;

    function render() {
        const radius = Math.min(sphere.clientWidth, sphere.clientHeight) * (options.radiusScale ?? 0.38);
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);

        points.forEach((point, index) => {
            const rotatedX = point.x * cosY + point.z * sinY;
            const depth = -point.x * sinY + point.z * cosY;
            const rotatedY = point.y * cosX - depth * sinX;
            const rotatedZ = point.y * sinX + depth * cosX;
            const depthRatio = (rotatedZ + 1) / 2;
            const scale = 0.72 + depthRatio * 0.36;

            tags[index].style.transform = `translate3d(${rotatedX * radius}px, ${rotatedY * radius}px, ${rotatedZ * radius}px) translate(-50%, -50%) scale(${scale})`;
            tags[index].style.opacity = `${0.38 + depthRatio * 0.62}`;
            tags[index].style.zIndex = `${Math.round(depthRatio * 10)}`;
        });
    }

    function animate() {
        rotationY += 0.002;
        render();
        requestAnimationFrame(animate);
    }

    render();
    if (!reducedMotion) requestAnimationFrame(animate);
    if (!options.interactive) {
        window.addEventListener("resize", render);
        return;
    }

    sphere.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary) return;
        dragging = true;
        previousPointerX = event.clientX;
        previousPointerY = event.clientY;
        sphere.setPointerCapture(event.pointerId);
    });
    sphere.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        rotationY += (event.clientX - previousPointerX) * 0.008;
        rotationX += (event.clientY - previousPointerY) * 0.008;
        previousPointerX = event.clientX;
        previousPointerY = event.clientY;
        render();
    });
    sphere.addEventListener("pointerup", () => { dragging = false; });
    sphere.addEventListener("pointercancel", () => { dragging = false; });
    sphere.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        rotationY += event.key === "ArrowLeft" ? -0.2 : 0.2;
        render();
    });
    window.addEventListener("resize", render);
}

setupTechnologySphere(document.querySelector(".technology-sphere"), { interactive: true });

const customCursor = document.querySelector(".custom-cursor");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (finePointer) {
    if (!reducedMotion) {
        document.querySelectorAll(".project-card").forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
                card.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
            });
        });
    }

    document.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;
        document.documentElement.classList.add("has-custom-cursor");
        customCursor.classList.add("is-visible");
        customCursor.style.setProperty("--cursor-x", `${event.clientX}px`);
        customCursor.style.setProperty("--cursor-y", `${event.clientY}px`);
        customCursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, input, textarea, select, [tabindex]")));
    });
    document.addEventListener("pointerout", (event) => {
        if (event.relatedTarget) return;
        document.documentElement.classList.remove("has-custom-cursor");
        customCursor.classList.remove("is-visible", "is-hovering");
    });
    window.addEventListener("blur", () => {
        document.documentElement.classList.remove("has-custom-cursor");
        customCursor.classList.remove("is-visible", "is-hovering");
    });
}
