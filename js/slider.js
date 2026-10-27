/**
 * Скользящий «маркер» выбора для списка дней и сегментных переключателей.
 * Маркер — один абсолютный элемент внутри контейнера; при смене .active
 * он плавно переезжает на нового кандидата (transform + размеры, без layout).
 * Запас --slide-grow на контейнере делает маркер крупнее ячейки.
 */
const BOXES = 'nav ul, .segmented';

function place(box) {
    const slide = box.querySelector(':scope > .slide');
    const active = box.querySelector('.active');
    if (!slide) return;
    if (!active || !active.offsetWidth) { slide.style.opacity = '0'; return; }
    const b = box.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    const g = parseFloat(getComputedStyle(box).getPropertyValue('--slide-grow')) || 0;
    // Размер берём без учёта transform (активный день увеличен scale-ом),
    // а центр — из реального положения.
    const w = active.offsetWidth + g * 2;
    const h = active.offsetHeight + g * 2;
    const x = r.left + r.width / 2 - b.left - box.clientLeft - w / 2;
    const y = r.top + r.height / 2 - b.top - box.clientTop - h / 2;
    slide.style.width = `${w}px`;
    slide.style.height = `${h}px`;
    slide.style.transform = `translate(${x}px, ${y}px)`;
    slide.style.opacity = '1';
}

export function initSliders() {
    document.querySelectorAll(BOXES).forEach(box => {
        const slide = document.createElement('span');
        slide.className = 'slide';
        slide.setAttribute('aria-hidden', 'true');
        box.appendChild(slide);

        let queued = false;
        const update = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; place(box); });
        };
        new MutationObserver(update).observe(box, {
            subtree: true, childList: true, attributes: true, attributeFilter: ['class']
        });
        new ResizeObserver(update).observe(box);
        place(box);
        // Первую позицию ставим без анимации, дальше включаем переходы.
        requestAnimationFrame(() => requestAnimationFrame(() => { box.dataset.slide = 'ready'; }));
    });
    if (document.fonts?.ready) document.fonts.ready.then(() => {
        document.querySelectorAll(BOXES).forEach(place);
    });
}
